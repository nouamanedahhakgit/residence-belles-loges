import React, { useState, useMemo } from 'react';
import { useSyndic } from '../context/SyndicContext';
import { 
  X, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  FileText,
  Save,
  KeyRound
} from 'lucide-react';
import { 
  formatWhatsAppPhones, 
  MESSAGE_TEMPLATES, 
  generateWhatsAppMessage, 
  buildWhatsAppLink, 
  buildWhatsAppWebLink 
} from '../lib/whatsapp';
import { generateAppelDeFondPDF } from '../lib/pdfGenerator';

export default function WhatsAppHubModal() {
  const { 
    enrichedLots, 
    activeModal, 
    setActiveModal, 
    modalPayload, 
    residence, 
    selectedYear,
    logWhatsApp,
    whatsappLogs,
    updateCoproprietairePhone
  } = useSyndic();

  if (activeModal !== 'whatsapp') return null;

  // Grouper les lots par copropriétaire pour éviter les doublons de contacts
  const coproprietairesList = useMemo(() => {
    const map = {};
    enrichedLots.forEach(lot => {
      const cNom = lot.coproprietaire.nom;
      if (!map[cNom]) {
        map[cNom] = {
          nom: cNom,
          tel: lot.coproprietaire.tel,
          sec_tel: lot.coproprietaire.sec_tel,
          whatsapp: lot.coproprietaire.whatsapp,
          pin: lot.coproprietaire.pin || (lot.coproprietaire.tel ? lot.coproprietaire.tel.replace(/[^\d]/g, '').slice(-4) : '1234'),
          lots: [],
          totalPaye: 0,
          resteAnnuel: 0,
          arrieres: 0,
          totalDu: 0
        };
      }
      map[cNom].lots.push(lot);
      map[cNom].totalPaye += lot.totalPaye;
      map[cNom].resteAnnuel += Math.max(0, lot.resteAnnuel);
      map[cNom].arrieres += lot.arrieres;
      map[cNom].totalDu += lot.totalDu;
    });

    return Object.values(map);
  }, [enrichedLots]);

  // État local de la modale
  const initialSelected = modalPayload 
    ? coproprietairesList.find(c => c.nom === (modalPayload.coproprietaire?.nom || modalPayload.nom)) || coproprietairesList[0]
    : coproprietairesList[0];

  const [selectedCopro, setSelectedCopro] = useState(initialSelected);
  const [filterMode, setFilterMode] = useState('tous'); // 'tous', 'impaye', 'arrieres', 'a_jour'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(MESSAGE_TEMPLATES.APPEL_FOND_FR);
  const [lang, setLang] = useState('FR'); // 'FR' ou 'DARIJA'
  const [customMessage, setCustomMessage] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

  const handleSavePhone = async () => {
    if (!selectedPhone || !selectedCopro) return;
    const targetCoproId = selectedCopro.lots[0]?.copro_id || selectedCopro.nom;
    await updateCoproprietairePhone(targetCoproId, selectedPhone);
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 2500);
  };

  // Mettre à jour le téléphone et message quand le copropriétaire ou template change
  React.useEffect(() => {
    if (selectedCopro) {
      const phones = formatWhatsAppPhones(selectedCopro.tel);
      setSelectedPhone(phones[0] || '');

      const isDarija = lang === 'DARIJA';
      let templateKey = MESSAGE_TEMPLATES.APPEL_FOND_FR;
      if (selectedTemplate.includes('ACCES')) {
        templateKey = isDarija ? MESSAGE_TEMPLATES.ACCES_CLIENT_DARIJA : MESSAGE_TEMPLATES.ACCES_CLIENT_FR;
      } else if (selectedTemplate.includes('RAPPEL')) {
        templateKey = isDarija ? MESSAGE_TEMPLATES.RAPPEL_COURTOIS_DARIJA : MESSAGE_TEMPLATES.RAPPEL_COURTOIS_FR;
      } else if (selectedTemplate.includes('RELANCE')) {
        templateKey = MESSAGE_TEMPLATES.RELANCE_URGENTE_FR;
      } else if (selectedTemplate.includes('RECU')) {
        templateKey = isDarija ? MESSAGE_TEMPLATES.RECU_PAIEMENT_DARIJA : MESSAGE_TEMPLATES.RECU_PAIEMENT_FR;
      } else {
        templateKey = isDarija ? MESSAGE_TEMPLATES.APPEL_FOND_DARIJA : MESSAGE_TEMPLATES.APPEL_FOND_FR;
      }

      const lotsDescriptions = selectedCopro.lots.map(l => l.code).join(' + ');
      const lotsNumeros = selectedCopro.lots.map(l => l.nom).join(', ');
      const primaryLot = selectedCopro.lots[0];
      const pinCode = selectedCopro.pin || primaryLot?.coproprietaire?.pin || (selectedCopro.tel ? selectedCopro.tel.replace(/[^\d]/g, '').slice(-4) : '1234');

      const msg = generateWhatsAppMessage({
        template: templateKey,
        coproprietaireNom: selectedCopro.nom,
        lotCode: lotsDescriptions,
        lotNumero: lotsNumeros,
        montantDu: selectedCopro.totalDu,
        periode: `Année ${selectedYear}`,
        rib: residence.rib,
        banque: residence.banque,
        titulaire: residence.nom,
        arrieres: selectedCopro.arrieres,
        montantPaye: selectedCopro.totalPaye,
        clientPin: pinCode
      });

      setCustomMessage(msg);
    }
  }, [selectedCopro, selectedTemplate, lang, selectedYear, residence]);

  // Filtrer la liste
  const filteredList = useMemo(() => {
    return coproprietairesList.filter(c => {
      if (filterMode === 'impaye' && c.totalDu <= 0) return false;
      if (filterMode === 'arrieres' && c.arrieres <= 0) return false;
      if (filterMode === 'a_jour' && c.totalDu > 0) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNom = c.nom.toLowerCase().includes(q);
        const matchLots = c.lots.some(l => l.code.toLowerCase().includes(q) || l.nom.toLowerCase().includes(q));
        if (!matchNom && !matchLots) return false;
      }

      return true;
    }).sort((a, b) => b.totalDu - a.totalDu);
  }, [coproprietairesList, filterMode, searchTerm]);

  // Liste des numéros disponibles pour le copro sélectionné
  const availablePhones = useMemo(() => {
    return selectedCopro ? formatWhatsAppPhones(selectedCopro.tel) : [];
  }, [selectedCopro]);

  // Envoi WhatsApp
  const handleSendWhatsApp = (isWeb = false) => {
    if (!selectedPhone) {
      alert('Veuillez renseigner un numéro de téléphone valide.');
      return;
    }

    const url = isWeb 
      ? buildWhatsAppWebLink(selectedPhone, customMessage)
      : buildWhatsAppLink(selectedPhone, customMessage);

    logWhatsApp({
      lotId: selectedCopro?.lots[0]?.id || 'multi',
      name: selectedCopro.nom,
      phone: selectedPhone,
      template: selectedTemplate,
      message: customMessage
    });

    window.open(url, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!selectedCopro) return;
    const firstLot = selectedCopro.lots[0];
    generateAppelDeFondPDF({
      coproprietaireNom: selectedCopro.nom,
      lots: selectedCopro.lots.map(l => ({
        code: l.code,
        nom: l.nom,
        montant: l.type === 'magasin' ? 1800 : (l.resteAnnuel > 0 ? l.resteAnnuel : 900),
        observation: `Exercice ${selectedYear}`
      })),
      arrieres: selectedCopro.arrieres,
      rib: residence.rib,
      residenceNom: residence.nom,
      residenceAdresse: residence.adresse
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* En-tête de la modale */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Hub WhatsApp & Accès Copropriétaires</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-semibold">
                  Direct Link wa.me
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Envoyez les Appels de Fond, Reçus ou Liens d'accès au portail avec Code PIN en un clic.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps double-colonnes */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Colonne Gauche : Liste des Destinataires avec Filtres de Statut */}
          <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/60 dark:bg-slate-950/40">
            {/* Filtres de statut */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrer par nom ou lot..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Boutons Statut */}
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                <button
                  onClick={() => setFilterMode('tous')}
                  className={`py-1 px-1.5 rounded-lg text-center font-semibold transition-colors ${
                    filterMode === 'tous' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  Tous ({coproprietairesList.length})
                </button>
                <button
                  onClick={() => setFilterMode('impaye')}
                  className={`py-1 px-1.5 rounded-lg text-center font-semibold transition-colors ${
                    filterMode === 'impaye' ? 'bg-amber-100 dark:bg-amber-600/40 text-amber-900 dark:text-amber-200 border border-amber-300' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  Impayés
                </button>
                <button
                  onClick={() => setFilterMode('arrieres')}
                  className={`py-1 px-1.5 rounded-lg text-center font-semibold transition-colors ${
                    filterMode === 'arrieres' ? 'bg-red-100 dark:bg-red-600/40 text-red-900 dark:text-red-200 border border-red-300' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  Arriérés
                </button>
                <button
                  onClick={() => setFilterMode('a_jour')}
                  className={`py-1 px-1.5 rounded-lg text-center font-semibold transition-colors ${
                    filterMode === 'a_jour' ? 'bg-emerald-100 dark:bg-emerald-600/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  À jour
                </button>
              </div>
            </div>

            {/* Liste scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredList.map((c) => {
                const isSelected = selectedCopro?.nom === c.nom;
                const hasDebt = c.totalDu > 0;
                const phones = formatWhatsAppPhones(c.tel);

                return (
                  <button
                    key={c.nom}
                    onClick={() => setSelectedCopro(c)}
                    className={`w-full text-left p-3 transition-colors flex items-start justify-between ${
                      isSelected 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-l-4 border-emerald-600' 
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{c.nom}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {c.lots.map(l => l.code).join(', ')} • {phones[0] ? `+${phones[0]}` : 'Sans tél'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold ${hasDebt ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {c.totalDu.toLocaleString('fr-FR')} DH
                      </span>
                      {c.arrieres > 0 && (
                        <p className="text-[9px] text-red-600 dark:text-red-400 font-medium">+{c.arrieres} arr.</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colonne Droite : Paramétrage & Prévisualisation du Message WhatsApp */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-900/60">
            {selectedCopro ? (
              <div className="space-y-4">
                {/* Bandeau d'infos copropriétaire */}
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedCopro.nom}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Bien(s) : <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedCopro.lots.map(l => `${l.nom} (${l.code})`).join(' & ')}</span>
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[11px] text-slate-500 font-mono">Code PIN Portail :</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs">
                        {selectedCopro.pin}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Total Solde Dû</p>
                      <p className="text-base font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                        {selectedCopro.totalDu.toLocaleString('fr-FR')} DH
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-600"
                      title="Générer et télécharger l'Appel de Fond PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Sélecteur de Template & Langue */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Template */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1">
                      Type de notification
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-500"
                    >
                      <option value={MESSAGE_TEMPLATES.APPEL_FOND_FR}>📢 Appel de Fond Officiel</option>
                      <option value={MESSAGE_TEMPLATES.ACCES_CLIENT_FR}>🔐 Accès Espace Copropriétaire (Lien + PIN)</option>
                      <option value={MESSAGE_TEMPLATES.RAPPEL_COURTOIS_FR}>⏰ Rappel Courtois (Solde en cours)</option>
                      <option value={MESSAGE_TEMPLATES.RELANCE_URGENTE_FR}>⚠️ Relance Urgente (Arriérés antérieurs)</option>
                      <option value={MESSAGE_TEMPLATES.RECU_PAIEMENT_FR}>✅ Confirmation & Reçu de Paiement</option>
                    </select>
                  </div>

                  {/* Langue & Numéro */}
                  <div className="flex space-x-2">
                    <div className="w-1/3">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1">
                        Langue
                      </label>
                      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
                        <button
                          onClick={() => setLang('FR')}
                          className={`flex-1 py-1 rounded-lg text-center font-semibold ${
                            lang === 'FR' ? 'bg-white dark:bg-brand-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          Français
                        </button>
                        <button
                          onClick={() => setLang('DARIJA')}
                          className={`flex-1 py-1 rounded-lg text-center font-semibold ${
                            lang === 'DARIJA' ? 'bg-white dark:bg-brand-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          Darija 🇲🇦
                        </button>
                      </div>
                    </div>

                    {/* Sélection et modification du numéro */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-400">
                          Numéro WhatsApp
                        </label>
                        <button
                          type="button"
                          onClick={handleSavePhone}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center space-x-1"
                          title="Sauvegarder ce numéro dans Supabase"
                        >
                          <Save className="w-3 h-3" />
                          <span>{phoneSaved ? 'Enregistré !' : 'Sauvegarder n°'}</span>
                        </button>
                      </div>

                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          placeholder="Ex: 0669281802 ou 212669281802"
                          value={selectedPhone}
                          onChange={(e) => setSelectedPhone(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                        />
                        {availablePhones.length > 1 && (
                          <select
                            value={selectedPhone}
                            onChange={(e) => setSelectedPhone(e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2 text-xs text-slate-700 dark:text-slate-300 font-mono"
                            title="Choisir parmi les numéros disponibles"
                          >
                            {availablePhones.map(p => (
                              <option key={p} value={p}>+{p}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prévisualisation & Édition du Message */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                      <span>Message à envoyer (modifiable en direct) :</span>
                    </label>
                    <button
                      onClick={handleCopy}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center space-x-1 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={9}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>

                {/* Boutons d'Action WhatsApp */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>N'oubliez pas de joindre le PDF téléchargé si vous souhaitez joindre la facture !</span>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {/* WhatsApp Web */}
                    <button
                      onClick={() => handleSendWhatsApp(true)}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>WhatsApp Web</span>
                    </button>

                    {/* WhatsApp Direct wa.me */}
                    <button
                      onClick={() => handleSendWhatsApp(false)}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer via wa.me</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Sélectionnez un copropriétaire dans la liste
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
