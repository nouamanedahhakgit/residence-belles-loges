import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { initialData } from '../data/initialData';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

const SyndicContext = createContext();

const STORAGE_KEY = 'BELLES_LOGES_APP_STATE_V1';

export function SyndicProvider({ children }) {
  // 1. État initial (local storage ou données pré-chargées)
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
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Modales
  const [activeModal, setActiveModal] = useState(null);
  const [modalPayload, setModalPayload] = useState(null);

  // Sauvegarde locale automatique
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    }
  }, [appState]);

  // 2. Chargement en direct depuis Supabase (Live Sync)
  const loadDataFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      setIsSyncing(true);

      // Charger residence_info
      const { data: resData } = await supabase.from('residence_info').select('*').limit(1);
      
      // Charger coproprietaires
      const { data: coprosData, error: errCopros } = await supabase.from('coproprietaires').select('*');
      
      // Charger lots
      const { data: lotsData, error: errLots } = await supabase.from('lots').select('*').order('code_lot');
      
      // Charger cotisations_annuelles
      const { data: cotisData, error: errCotis } = await supabase.from('cotisations_annuelles').select('*');

      // Charger paiements
      const { data: pData } = await supabase.from('paiements').select('*').order('created_at', { ascending: false });

      // Charger historique_whatsapp
      const { data: waData } = await supabase.from('historique_whatsapp').select('*').order('envoye_le', { ascending: false });

      if (!errCopros && !errLots && !errCotis && lotsData && cotisData) {
        // Mapper les structures Supabase
        const mappedCopros = (coprosData || []).map(c => ({
          id: c.id,
          nom: c.nom_complet,
          tel: c.telephone || '',
          sec_tel: c.telephone_secondaire || '',
          whatsapp: Boolean(c.whatsapp_active)
        }));

        const mappedLots = lotsData.map(l => ({
          id: l.id,
          code: l.code_lot,
          nom: l.numero_lot,
          type: l.type_lot,
          etage: l.etage,
          copro_id: l.coproprietaire_id,
          date_acq: l.date_acquisition,
          cotisation: Number(l.cotisation_mensuelle) || 300
        }));

        const mappedCotisations = cotisData.map(c => ({
          lot_id: c.lot_id,
          annee: c.annee,
          months: [
            Number(c.m01) || 0, Number(c.m02) || 0, Number(c.m03) || 0,
            Number(c.m04) || 0, Number(c.m05) || 0, Number(c.m06) || 0,
            Number(c.m07) || 0, Number(c.m08) || 0, Number(c.m09) || 0,
            Number(c.m10) || 0, Number(c.m11) || 0, Number(c.m12) || 0
          ],
          montant_annuel: Number(c.montant_exige_annuel) || 3600,
          arrieres: Number(c.arrieres_anterieurs) || 0
        }));

        setAppState(prev => ({
          ...prev,
          residence: resData?.[0] ? {
            nom: resData[0].nom,
            adresse: resData[0].adresse,
            rib: resData[0].rib,
            banque: resData[0].banque,
            compte: resData[0].titulaire_compte
          } : prev.residence,
          coproprietaires: mappedCopros.length > 0 ? mappedCopros : prev.coproprietaires,
          lots: mappedLots.length > 0 ? mappedLots : prev.lots,
          cotisations: mappedCotisations.length > 0 ? mappedCotisations : prev.cotisations,
          payments: pData || prev.payments,
          whatsappLogs: waData || prev.whatsappLogs
        }));

        setIsSupabaseOnline(true);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Erreur lors du chargement live depuis Supabase:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Tester et charger au démarrage
  useEffect(() => {
    if (isSupabaseConfigured()) {
      testSupabaseConnection().then(res => {
        setIsSupabaseOnline(res.success);
        if (res.success) {
          loadDataFromSupabase();
        }
      });
    }
  }, [loadDataFromSupabase]);

  // Lookup maps
  const coproMap = useMemo(() => {
    const map = {};
    for (let c of appState.coproprietaires) {
      map[c.id] = c;
    }
    return map;
  }, [appState.coproprietaires]);

  // Données enrichies des lots pour l'année sélectionnée
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

  // Lots filtrés
  const filteredLots = useMemo(() => {
    return enrichedLots.filter(lot => {
      if (filterStatus === 'a_jour' && (lot.totalDu > 0)) return false;
      if (filterStatus === 'retard' && (lot.totalDu <= 0 || lot.totalPaye === 0)) return false;
      if (filterStatus === 'impaye' && (lot.totalPaye > 0 || lot.totalDu <= 0)) return false;
      if (filterStatus === 'arrieres' && (lot.arrieres <= 0)) return false;

      if (filterType !== 'all' && lot.type !== filterType) return false;

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

  // 3. Mise à jour d'un montant mensuel (Écriture en direct dans Supabase)
  const updateMonthlyPayment = async (lotId, monthIndex, newAmount) => {
    const val = Number(newAmount) || 0;

    // Mise à jour optimiste locale
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

    // Écriture en direct dans la base de données Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        setIsSyncing(true);
        const monthCol = `m${String(monthIndex + 1).padStart(2, '0')}`;
        const { error } = await supabase
          .from('cotisations_annuelles')
          .update({ [monthCol]: val, updated_at: new Date() })
          .match({ lot_id: lotId, annee: selectedYear });

        if (error) {
          console.error('Erreur écriture Supabase:', error);
        } else {
          setLastSyncTime(new Date());
        }
      } catch (err) {
        console.error('Erreur réseau Supabase:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // 4. Enregistrement d'un paiement (Écriture dans Supabase)
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

    // Supabase
    if (isSupabaseConfigured() && supabase) {
      try {
        setIsSyncing(true);
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

        // Mettre à jour aussi les colonnes mensuelles dans Supabase
        if (moisPayes && moisPayes.length > 0) {
          const lot = appState.lots.find(l => l.id === lotId);
          const montMensuel = lot?.cotisation || 300;
          const updates = { updated_at: new Date() };
          moisPayes.forEach(mIdx => {
            const col = `m${String(mIdx + 1).padStart(2, '0')}`;
            updates[col] = montMensuel;
          });
          await supabase
            .from('cotisations_annuelles')
            .update(updates)
            .match({ lot_id: lotId, annee: selectedYear });
        }
        setLastSyncTime(new Date());
      } catch (err) {
        console.error('Erreur Supabase insertion paiement:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // 5. Mise à jour du téléphone d'un copropriétaire (avec sauvegarde Supabase)
  const updateCoproprietairePhone = async (coproId, newPhone) => {
    const cleanPhone = String(newPhone).trim();

    setAppState(prev => {
      const updatedCopros = prev.coproprietaires.map(c => {
        if (c.id === coproId || c.nom === coproId) {
          return { ...c, tel: cleanPhone, whatsapp: Boolean(cleanPhone) };
        }
        return c;
      });
      return { ...prev, coproprietaires: updatedCopros };
    });

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('coproprietaires')
          .update({ 
            telephone: cleanPhone, 
            whatsapp_active: Boolean(cleanPhone), 
            updated_at: new Date() 
          })
          .match({ id: coproId });
      } catch (err) {
        console.error('Erreur mise à jour téléphone Supabase:', err);
      }
    }
  };

  // 6. Enregistrement d'un log WhatsApp
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

  // Exporter en Excel (.xlsx)
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

  const resetToExcelDefaults = () => {
    if (window.confirm('Voulez-vous réinitialiser toutes les données à l\'état initial du fichier Excel ?')) {
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
    lastSyncTime,
    loadDataFromSupabase,
    whatsappLogs: appState.whatsappLogs,
    payments: appState.payments,
    activeModal,
    setActiveModal,
    modalPayload,
    setModalPayload,
    updateMonthlyPayment,
    updateCoproprietairePhone,
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
