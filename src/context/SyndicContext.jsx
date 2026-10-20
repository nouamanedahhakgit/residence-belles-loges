import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initialData } from '../data/initialData';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

const SyndicContext = createContext();

const STORAGE_KEY = 'BELLES_LOGES_APP_STATE_V1';

export function SyndicProvider({ children }) {
  // 1. Initial State from localStorage or initialData
  const [appState, setAppState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved state, using default', e);
        }
      }
    }
    return {
      residence: initialData.residence,
      coproprietaires: initialData.coproprietaires,
      lots: initialData.lots,
      cotisations: initialData.cotisations,
      whatsappLogs: [],
      payments: []
    };
  });

  const [selectedYear, setSelectedYear] = useState(2026);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'a_jour', 'retard', 'arrieres'
  const [filterType, setFilterType] = useState('all');     // 'all', 'appartement', 'magasin'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals management
  const [activeModal, setActiveModal] = useState(null); // 'whatsapp', 'appel_fond', 'paiement', 'settings'
  const [modalPayload, setModalPayload] = useState(null);

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    }
  }, [appState]);

  // Test Supabase connection on mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      testSupabaseConnection().then(res => {
        setIsSupabaseOnline(res.success);
      });
    }
  }, []);

  // Quick lookup maps
  const coproMap = useMemo(() => {
    const map = {};
    for (let c of appState.coproprietaires) {
      map[c.id] = c;
    }
    return map;
  }, [appState.coproprietaires]);

  const lotMap = useMemo(() => {
    const map = {};
    for (let l of appState.lots) {
      map[l.id] = l;
    }
    return map;
  }, [appState.lots]);

  // Enrich lot data with cotisation for active year
  const enrichedLots = useMemo(() => {
    return appState.lots.map(lot => {
      const copro = coproMap[lot.copro_id] || {
        nom: 'Inconnu',
        tel: '',
        sec_tel: '',
        whatsapp: false
      };

      const cotis = appState.cotisations.find(
        c => c.lot_id === lot.id && c.annee === selectedYear
      ) || {
        lot_id: lot.id,
        annee: selectedYear,
        months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        montant_annuel: lot.type === 'magasin' ? 1800 : 3600,
        arrieres: 0
      };

      const totalPaye = (cotis.months || []).reduce((acc, v) => acc + (Number(v) || 0), 0);
      const resteAnnuel = (cotis.montant_annuel || 0) - totalPaye;
      const arrieres = Number(cotis.arrieres) || 0;
      const totalDu = Math.max(0, resteAnnuel) + arrieres;

      let statut = 'a_jour';
      if (resteAnnuel > 0 && totalPaye > 0) {
        statut = 'retard';
      } else if (totalPaye === 0 && (cotis.montant_annuel || 0) > 0) {
        statut = 'impaye';
      }

      return {
        ...lot,
        coproprietaire: copro,
        cotisation: cotis,
        totalPaye,
        resteAnnuel,
        arrieres,
        totalDu,
        statut
      };
    });
  }, [appState.lots, appState.cotisations, coproMap, selectedYear]);

  // Lots filtrés pour affichage
  const filteredLots = useMemo(() => {
    return enrichedLots.filter(lot => {
      // Filtre statut
      if (filterStatus === 'a_jour' && (lot.totalDu > 0)) return false;
      if (filterStatus === 'retard' && (lot.totalDu <= 0 || lot.totalPaye === 0)) return false;
      if (filterStatus === 'impaye' && (lot.totalPaye > 0 || lot.totalDu <= 0)) return false;
      if (filterStatus === 'arrieres' && (lot.arrieres <= 0)) return false;

      // Filtre type
      if (filterType !== 'all' && lot.type !== filterType) return false;

      // Recherche texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNom = lot.coproprietaire.nom.toLowerCase().includes(q);
        const matchLot = lot.nom.toLowerCase().includes(q) || lot.code.toLowerCase().includes(q);
        const matchTel = lot.coproprietaire.tel.includes(q) || (lot.coproprietaire.sec_tel || '').includes(q);
        if (!matchNom && !matchLot && !matchTel) return false;
      }

      return true;
    });
  }, [enrichedLots, filterStatus, filterType, searchQuery]);

  // Statistiques globales
  const stats = useMemo(() => {
    let totalExige = 0;
    let totalRecouvre = 0;
    let totalReste = 0;
    let totalArrieres = 0;
    let countAJour = 0;
    let countEnRetard = 0;
    let countImpaye = 0;

    enrichedLots.forEach(l => {
      totalExige += l.cotisation.montant_annuel || 0;
      totalRecouvre += l.totalPaye;
      totalReste += Math.max(0, l.resteAnnuel);
      totalArrieres += l.arrieres;

      if (l.totalDu <= 0) {
        countAJour++;
      } else if (l.totalPaye > 0) {
        countEnRetard++;
      } else {
        countImpaye++;
      }
    });

    const tauxRecouvrement = totalExige > 0 ? Math.round((totalRecouvre / totalExige) * 100) : 0;

    return {
      totalLots: enrichedLots.length,
      totalExige,
      totalRecouvre,
      totalReste,
      totalArrieres,
      totalDuGlobal: totalReste + totalArrieres,
      tauxRecouvrement,
      countAJour,
      countEnRetard,
      countImpaye
    };
  }, [enrichedLots]);

  // 2. Action: Mettre à jour un montant mensuel inline
  const updateMonthlyPayment = async (lotId, monthIndex, newAmount) => {
    const val = Number(newAmount) || 0;

    setAppState(prev => {
      const newCotisations = prev.cotisations.map(c => {
        if (c.lot_id === lotId && c.annee === selectedYear) {
          const newMonths = [...c.months];
          newMonths[monthIndex] = val;
          return { ...c, months: newMonths };
        }
        return c;
      });

      return { ...prev, cotisations: newCotisations };
    });

    // Sync avec Supabase si actif
    if (isSupabaseConfigured() && supabase) {
      try {
        const monthCol = `m${String(monthIndex + 1).padStart(2, '0')}`;
        await supabase
          .from('cotisations_annuelles')
          .update({ [monthCol]: val, updated_at: new Date() })
          .match({ lot_id: lotId, annee: selectedYear });
      } catch (err) {
        console.error('Erreur sync Supabase:', err);
      }
    }
  };

  // 3. Action: Enregistrer un nouveau paiement
  const recordPayment = async ({ lotId, montant, modePaiement, reference, moisPayes, datePaiement, remarques }) => {
    const newPayment = {
      id: crypto.randomUUID(),
      lotId,
      montant: Number(montant),
      modePaiement,
      reference,
      moisPayes,
      datePaiement: datePaiement || new Date().toISOString().split('T')[0],
      remarques,
      createdAt: new Date().toISOString()
    };

    setAppState(prev => {
      // Si des mois spécifiques sont cochés, on les remplit
      let updatedCotisations = [...prev.cotisations];
      if (moisPayes && moisPayes.length > 0) {
        const target = updatedCotisations.find(c => c.lot_id === lotId && c.annee === selectedYear);
        if (target) {
          const lot = prev.lots.find(l => l.id === lotId);
          const montMensuel = lot?.cotisation || 300;
          const newMonths = [...target.months];
          moisPayes.forEach(mIdx => {
            newMonths[mIdx] = montMensuel;
          });
          updatedCotisations = updatedCotisations.map(c => 
            c.lot_id === lotId && c.annee === selectedYear ? { ...c, months: newMonths } : c
          );
        }
      }

      return {
        ...prev,
        cotisations: updatedCotisations,
        payments: [newPayment, ...prev.payments]
      };
    });

    // Supabase sync
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('paiements').insert([{
          lot_id: lotId,
          annee: selectedYear,
          mois: (moisPayes || []).map(m => m + 1),
          montant: Number(montant),
          mode_paiement: modePaiement,
          reference_paiement: reference,
          date_paiement: datePaiement || new Date(),
          remarques
        }]);
      } catch (err) {
        console.error('Erreur Supabase insertion paiement:', err);
      }
    }
  };

  // 4. Action: Enregistrer un log WhatsApp
  const logWhatsApp = (logItem) => {
    const log = {
      id: crypto.randomUUID(),
      ...logItem,
      date: new Date().toISOString()
    };
    setAppState(prev => ({
      ...prev,
      whatsappLogs: [log, ...prev.whatsappLogs]
    }));

    if (isSupabaseConfigured() && supabase) {
      supabase.from('historique_whatsapp').insert([{
        lot_id: logItem.lotId,
        destinataire_tel: logItem.phone,
        destinataire_nom: logItem.name,
        type_message: logItem.template,
        message_texte: logItem.message,
        statut: 'envoye'
      }]).then();
    }
  };

  // 5. Exporter en fichier Excel XLSX
  const exportToExcel = () => {
    const rows = enrichedLots.map(l => ({
      'Code Lot': l.code,
      'N° du Lot': l.nom,
      'Étage': l.etage,
      'Type': l.type === 'magasin' ? 'Magasin' : 'Appartement',
      'Nom du Copropriétaire': l.coproprietaire.nom,
      'Téléphone': l.coproprietaire.tel,
      'WhatsApp': l.coproprietaire.whatsapp ? 'Oui' : 'Non',
      'Jan': l.cotisation.months[0] || 0,
      'Fév': l.cotisation.months[1] || 0,
      'Mar': l.cotisation.months[2] || 0,
      'Avr': l.cotisation.months[3] || 0,
      'Mai': l.cotisation.months[4] || 0,
      'Juin': l.cotisation.months[5] || 0,
      'Juil': l.cotisation.months[6] || 0,
      'Août': l.cotisation.months[7] || 0,
      'Sept': l.cotisation.months[8] || 0,
      'Oct': l.cotisation.months[9] || 0,
      'Nov': l.cotisation.months[10] || 0,
      'Déc': l.cotisation.months[11] || 0,
      'Total Payé': l.totalPaye,
      'Reste à Payer': l.resteAnnuel,
      'Arriérés': l.arrieres,
      'Solde Dû Total': l.totalDu
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Cotisations ${selectedYear}`);
    XLSX.writeFile(wb, `Residence_Belles_Loges_Cotisations_${selectedYear}.xlsx`);
  };

  // Réinitialiser aux valeurs d'origine
  const resetToExcelDefaults = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser toutes les données à l\'état initial du fichier Excel ?')) {
      localStorage.removeItem(STORAGE_KEY);
      setAppState({
        residence: initialData.residence,
        coproprietaires: initialData.coproprietaires,
        lots: initialData.lots,
        cotisations: initialData.cotisations,
        whatsappLogs: [],
        payments: []
      });
      window.location.reload();
    }
  };

  const value = {
    residence: appState.residence,
    coproprietaires: appState.coproprietaires,
    lots: appState.lots,
    enrichedLots,
    filteredLots,
    stats,
    selectedYear,
    setSelectedYear,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    isSupabaseOnline,
    isSyncing,
    whatsappLogs: appState.whatsappLogs,
    payments: appState.payments,
    activeModal,
    setActiveModal,
    modalPayload,
    setModalPayload,
    updateMonthlyPayment,
    recordPayment,
    logWhatsApp,
    exportToExcel,
    resetToExcelDefaults
  };

  return (
    <SyndicContext.Provider value={value}>
      {children}
    </SyndicContext.Provider>
  );
}

export function useSyndic() {
  const context = useContext(SyndicContext);
  if (!context) {
    throw new Error('useSyndic must be used within a SyndicProvider');
  }
  return context;
}
