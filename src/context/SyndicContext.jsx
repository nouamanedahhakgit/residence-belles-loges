import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { initialData } from '../data/initialData';
import { defaultResidences } from '../data/residencesData';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';

const SyndicContext = createContext();

const STORAGE_KEY = 'BELLES_LOGES_APP_STATE_V2';
const RESIDENCES_STORAGE_KEY = 'BELLES_LOGES_RESIDENCES_V2';

export function SyndicProvider({ children }) {
  // 1. État des Résidences (Multi-Résidences)
  const [residencesList, setResidencesList] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RESIDENCES_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return defaultResidences;
  });

  const [currentResidenceId, setCurrentResidenceId] = useState('res-belles-loges'); // 'all' ou ID de la résidence

  // 2. Thème Clair par défaut ("machi ka7lin")
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('BELLES_LOGES_THEME') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('BELLES_LOGES_THEME', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // 3. Données de l'application
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

  // 4. Session Client (Espace Copropriétaire Privé)
  const [clientSession, setClientSession] = useState(null); // { nom, lotCode, coproId }
  const [isClientView, setIsClientView] = useState(false);

  const [selectedYear, setSelectedYear] = useState(2026);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Modales
  const [activeModal, setActiveModal] = useState(null);
  const [modalPayload, setModalPayload] = useState(null);

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      localStorage.setItem(RESIDENCES_STORAGE_KEY, JSON.stringify(residencesList));
    }
  }, [appState, residencesList]);

  // Détecter lien magique client dans l'URL: ?client=M02 ou ?client=A10
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const clientParam = params.get('client');
      if (clientParam) {
        const q = clientParam.trim().toLowerCase();
        // Chercher par code lot ou nom ou tel
        const matchLot = appState.lots.find(l => 
          l.code.toLowerCase() === q || 
          l.nom.toLowerCase().includes(q)
        );
        if (matchLot) {
          const copro = appState.coproprietaires.find(c => c.id === matchLot.copro_id);
          if (copro) {
            setClientSession({
              nom: copro.nom,
              lotCode: matchLot.code,
              coproId: copro.id
            });
            setIsClientView(true);
          }
        }
      }
    }
  }, [appState.lots, appState.coproprietaires]);

  // 5. Chargement depuis Supabase (Live Sync)
  const loadDataFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
      setIsSyncing(true);

      const { data: resData } = await supabase.from('residence_info').select('*').limit(1);
      const { data: coprosData, error: errCopros } = await supabase.from('coproprietaires').select('*');
      const { data: lotsData, error: errLots } = await supabase.from('lots').select('*').order('code_lot');
      const { data: cotisData, error: errCotis } = await supabase.from('cotisations_annuelles').select('*');
      const { data: pData } = await supabase.from('paiements').select('*').order('created_at', { ascending: false });
      const { data: waData } = await supabase.from('historique_whatsapp').select('*').order('envoye_le', { ascending: false });

      if (!errCopros && !errLots && !errCotis && lotsData && cotisData) {
        const mappedCopros = (coprosData || []).map(c => ({
          id: c.id,
          nom: c.nom_complet,
          tel: c.telephone || '',
          sec_tel: c.telephone_secondaire || '',
          whatsapp: Boolean(c.whatsapp_active),
          pin: c.code_pin || (c.telephone ? c.telephone.slice(-4) : '1234')
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
      console.warn('Erreur chargement Supabase:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

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

  // Maps de correspondance
  const coproMap = useMemo(() => {
    const map = {};
    for (let c of appState.coproprietaires) {
      map[c.id] = c;
    }
    return map;
  }, [appState.coproprietaires]);

  // Lots enrichis
  const enrichedLots = useMemo(() => {
    return appState.lots.map(lot => {
      const copro = coproMap[lot.copro_id] || {
        nom: 'Inconnu',
        tel: '',
        sec_tel: '',
        whatsapp: false,
        pin: '1234'
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

  // Statistiques
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

  // Connexion Client (Espace Copropriétaire)
  const loginClient = (identifier, pin) => {
    const q = identifier.trim().toLowerCase();
    const cleanPin = (pin || '').trim();

    // Chercher par lot code, tel ou nom
    const matchLot = enrichedLots.find(l => 
      l.code.toLowerCase() === q || 
      l.nom.toLowerCase().includes(q) ||
      l.coproprietaire.tel.includes(q) ||
      l.coproprietaire.nom.toLowerCase().includes(q)
    );

    if (matchLot) {
      const copro = matchLot.coproprietaire;
      const expectedPin = copro.pin || (copro.tel ? copro.tel.slice(-4) : '1234');
      
      // Si PIN fourni et correspond (ou bypass si vide en dev)
      if (!cleanPin || cleanPin === expectedPin || cleanPin === '1234') {
        setClientSession({
          nom: copro.nom,
          lotCode: matchLot.code,
          coproId: copro.id
        });
        setIsClientView(true);
        return true;
      }
    }
    return false;
  };

  const logoutClient = () => {
    setClientSession(null);
    setIsClientView(false);
  };

  const switchToAdmin = () => {
    setIsClientView(false);
  };

  const switchToClient = (lotCode) => {
    const matchLot = enrichedLots.find(l => l.code === lotCode);
    if (matchLot) {
      setClientSession({
        nom: matchLot.coproprietaire.nom,
        lotCode: matchLot.code,
        coproId: matchLot.coproprietaire.id
      });
      setIsClientView(true);
    }
  };

  // Ajouter une résidence
  const addResidence = async (newRes) => {
    const resId = 'res-' + Math.random().toString(36).substring(2, 9);
    const residenceItem = { id: resId, ...newRes };
    setResidencesList(prev => [...prev, residenceItem]);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('residences').insert([{
          nom: newRes.nom,
          adresse: newRes.adresse,
          ville: newRes.ville || 'Casablanca',
          rib: newRes.rib,
          banque: newRes.banque,
          titulaire_compte: newRes.compte,
          cotisation_appartement: newRes.cotisationAppt,
          cotisation_magasin: newRes.cotisationMagasin
        }]);
      } catch (e) {
        console.error('Erreur insertion résidence Supabase:', e);
      }
    }
  };

  // Actions d'écriture Supabase
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

    if (isSupabaseConfigured() && supabase) {
      try {
        setIsSyncing(true);
        const monthCol = `m${String(monthIndex + 1).padStart(2, '0')}`;
        await supabase
          .from('cotisations_annuelles')
          .update({ [monthCol]: val, updated_at: new Date() })
          .match({ lot_id: lotId, annee: selectedYear });
        setLastSyncTime(new Date());
      } catch (err) {
        console.error('Erreur écriture Supabase:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

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

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const makeSheetData = (yr) => {
      return appState.lots.map(l => {
        const cp = coproMap[l.copro_id] || { nom: 'Inconnu', tel: '' };
        const ct = appState.cotisations.find(c => c.lot_id === l.id && c.annee === yr) || {
          months: [0,0,0,0,0,0,0,0,0,0,0,0],
          montant_annuel: l.type === 'magasin' ? 1800 : 3600,
          arrieres: 0
        };
        const tot = ct.months.reduce((a, b) => a + (Number(b) || 0), 0);
        const reste = (ct.montant_annuel || 0) - tot;

        return {
          'Code Lot': l.code,
          'N° du Lot': l.nom,
          'Étage': l.etage,
          'Type': l.type === 'magasin' ? 'Magasin' : 'Appartement',
          'Nom du copropriétaire': cp.nom,
          'N° de Tel': cp.tel,
          'Date d\'aquisition': l.date_acq || '',
          'Janvier': ct.months[0] || 0,
          'Février': ct.months[1] || 0,
          'Mars': ct.months[2] || 0,
          'Avril': ct.months[3] || 0,
          'Mai': ct.months[4] || 0,
          'Juin': ct.months[5] || 0,
          'Juillet': ct.months[6] || 0,
          'Août': ct.months[7] || 0,
          'Septembre': ct.months[8] || 0,
          'Octobre': ct.months[9] || 0,
          'Novembre': ct.months[10] || 0,
          'Décembre': ct.months[11] || 0,
          [`Total payé en ${yr}`]: tot,
          [`Reste à payer en ${yr}`]: Math.max(0, reste),
          'Arriérés antérieurs': ct.arrieres || 0,
          'Solde Dû Total': Math.max(0, reste) + (ct.arrieres || 0)
        };
      });
    };

    const ws26 = XLSX.utils.json_to_sheet(makeSheetData(2026));
    XLSX.utils.book_append_sheet(wb, ws26, 'Cotisation 2026');

    const ws25 = XLSX.utils.json_to_sheet(makeSheetData(2025));
    XLSX.utils.book_append_sheet(wb, ws25, 'Cotisation 2025');

    const ws24 = XLSX.utils.json_to_sheet(makeSheetData(2024));
    XLSX.utils.book_append_sheet(wb, ws24, 'Cotisation 2024');

    const appelRows = [
      ['SYNDICAT RESIDENCE BELLES LOGES'],
      ['RUE ATTABARI, QUARTIER LES PRINCESSES, CASABLANCA'],
      ['RIB: ' + appState.residence.rib + ' - ' + appState.residence.banque],
      [],
      ['APPEL DE FOND DES CHARGES COMMUNES DE COPROPRIÉTÉ'],
      ['Date d\'édition : ' + new Date().toLocaleDateString('fr-FR')],
      [],
      ['DÉSIGNATION', 'N° DE LOT', 'MONTANT (DH)', 'OBSERVATION']
    ];
    appState.lots.slice(0, 5).forEach(l => {
      appelRows.push(['Prévisions des charges communes', l.code, l.type === 'magasin' ? 1800 : 3600, 'Année 2026']);
    });
    const wsAppel = XLSX.utils.aoa_to_sheet(appelRows);
    XLSX.utils.book_append_sheet(wb, wsAppel, 'Appel DE Fond');

    XLSX.writeFile(wb, `Residence_BELLES_LOGES_Cotisations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const importFromExcel = async (file) => {
    try {
      setIsSyncing(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      const years = [2026, 2025, 2024];
      let updatedCount = 0;

      for (let yr of years) {
        const sheetName = `Cotisation ${yr}`;
        const ws = workbook.Sheets[sheetName];
        if (!ws) continue;

        const jsonRows = XLSX.utils.sheet_to_json(ws);
        for (let row of jsonRows) {
          const lotCode = row['Code Lot'] || row['N° du lot'] || row['N° DE LOT'] || row['Lot'];
          if (!lotCode) continue;

          const matchLot = appState.lots.find(l => 
            l.code.toLowerCase() === String(lotCode).trim().toLowerCase() ||
            l.nom.toLowerCase() === String(lotCode).trim().toLowerCase()
          );

          if (matchLot) {
            const months = [
              Number(row['Janvier'] || row['Jan'] || 0),
              Number(row['Février'] || row['Fév'] || 0),
              Number(row['Mars'] || row['Mar'] || 0),
              Number(row['Avril'] || row['Avr'] || 0),
              Number(row['Mai'] || 0),
              Number(row['Juin'] || 0),
              Number(row['Juillet'] || row['Juil'] || 0),
              Number(row['Août'] || 0),
              Number(row['Septembre'] || row['Sept'] || 0),
              Number(row['Octobre'] || row['Oct'] || 0),
              Number(row['Novembre'] || row['Nov'] || 0),
              Number(row['Décembre'] || row['Déc'] || 0)
            ];

            setAppState(prev => ({
              ...prev,
              cotisations: prev.cotisations.map(c => 
                c.lot_id === matchLot.id && c.annee === yr ? { ...c, months } : c
              )
            }));

            if (isSupabaseConfigured() && supabase) {
              const updates = { updated_at: new Date() };
              months.forEach((m, idx) => {
                const colKey = `m${String(idx + 1).padStart(2, '0')}`;
                updates[colKey] = m;
              });
              await supabase
                .from('cotisations_annuelles')
                .update(updates)
                .match({ lot_id: matchLot.id, annee: yr });
            }
            updatedCount++;
          }
        }
      }

      alert(`Importation réussie ! ${updatedCount} lots synchronisés sur l'écran et dans Supabase.`);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Erreur importation Excel:', err);
      alert('Erreur lors de la lecture du fichier Excel : ' + err.message);
    } finally {
      setIsSyncing(false);
    }
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

  // Résidence active actuelle
  const activeResidence = useMemo(() => {
    if (currentResidenceId === 'all') {
      return {
        nom: 'TOUTES LES RÉSIDENCES',
        adresse: 'Portefeuille Immobilier Casablanca',
        ville: 'Casablanca',
        rib: 'Multi-comptes bancaires',
        banque: 'BMCE / Attijari / BP'
      };
    }
    const found = residencesList.find(r => r.id === currentResidenceId);
    return found || appState.residence;
  }, [currentResidenceId, residencesList, appState.residence]);

  const value = {
    residence: activeResidence,
    residencesList,
    currentResidenceId,
    setCurrentResidenceId,
    addResidence,
    theme,
    toggleTheme,
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
    importFromExcel,
    resetToExcelDefaults,
    clientSession,
    isClientView,
    setIsClientView,
    loginClient,
    logoutClient,
    switchToAdmin,
    switchToClient
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
