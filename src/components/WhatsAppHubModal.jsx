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
  FileText
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
    whatsappLogs
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
    ? coproprietairesList.find(c => c.nom === modalPayload.coproprietaire.nom) || coproprietairesList[0]
    : coproprietairesList[0];

  const [selectedCopro, setSelectedCopro] = useState(initialSelected);
  const [filterMode, setFilterMode] = useState('tous'); // 'tous', 'impaye', 'arrieres', 'a_jour'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(MESSAGE_TEMPLATES.APPEL_FOND_FR);
  const [lang, setLang] = useState('FR'); // 'FR' ou 'DARIJA'
  const [customMessage, setCustomMessage] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [copied, setCopied] = useState(false);

  // Mettre à jour le téléphone et message quand le copropriétaire ou template change
  React.useEffect(() => {
    if (selectedCopro) {
      const phones = formatWhatsAppPhones(selectedCopro.tel);
      setSelectedPhone(phones[0] || '');

      const isDarija = lang === 'DARIJA';
      let templateKey = MESSAGE_TEMPLATES.APPEL_FOND_FR;
      if (selectedTemplate.includes('RAPPEL')) {
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
        montantPaye: selectedCopro.totalPaye
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
    }).sort((a, b) => b.totalDu - a.totalDu); // Les plus endettés en premier
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

    // Journaliser
    logWhatsApp({
      lotId: selectedCopro?.lots[0]?.id,
      name: selectedCopro?.nom,
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
    generateAppelDeFondPDF({
      coproprietaireNom: selectedCopro.nom,
      lots: selectedCopro.lots.map(l => ({
        code: l.code,
        nom: l.nom,
        montant: Math.max(0, l.resteAnnuel),
        observation: `Exercice ${selectedYear}`
      })),
      arrieres: selectedCopro.arrieres,
      rib: residence.rib,
      residenceNom: residence.nom,
      residenceAdresse: residence.adresse
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* En-tête de la modale */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <span>Hub de Relances WhatsApp & Appels de Fonds</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Direct Link wa.me
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sélectionnez un copropriétaire selon son statut et envoyez-lui un message pré-rempli avec lien PDF.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps double-colonnes */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Colonne Gauche : Liste des Destinataires avec Filtres de Statut */}
          <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/40">
            {/* Filtres de statut */}
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrer copropriétaire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Boutons Statut */}
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                <button
                  onClick={() => setFilterMode('tous')}
                  className={`py-1 px-1.5 rounded text-center font-medium transition-colors ${
                    filterMode === 'tous' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tous ({coproprietairesList.length})
                </button>
                <button
                  onClick={() => setFilterMode('impaye')}
                  className={`py-1 px-1.5 rounded text-center font-medium transition-colors ${
                    filterMode === 'impaye' ? 'bg-amber-600/40 text-amber-200 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Impayés
                </button>
                <button
                  onClick={() => setFilterMode('arrieres')}
                  className={`py-1 px-1.5 rounded text-center font-medium transition-colors ${
                    filterMode === 'arrieres' ? 'bg-red-600/40 text-red-200 border border-red-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Arriérés
                </button>
                <button
                  onClick={() => setFilterMode('a_jour')}
                  className={`py-1 px-1.5 rounded text-center font-medium transition-colors ${
                    filterMode === 'a_jour' ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  À jour
                </button>
              </div>
            </div>

            {/* Liste scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
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
                        ? 'bg-emerald-500/10 border-l-4 border-emerald-500' 
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-100 truncate">{c.nom}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {c.lots.map(l => l.code).join(', ')} • {phones[0] ? `+${phones[0]}` : 'Sans tél'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-bold ${hasDebt ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {c.totalDu.toLocaleString('fr-FR')} DH
                      </span>
                      {c.arrieres > 0 && (
                        <p className="text-[9px] text-red-400 font-medium">+{c.arrieres} arr.</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colonne Droite : Paramétrage & Prévisualisation du Message WhatsApp */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-900/60">
            {selectedCopro ? (
              <div className="space-y-4">
                {/* Bandeau d'infos copropriétaire */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedCopro.nom}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Bien(s) : <span className="text-slate-200 font-medium">{selectedCopro.lots.map(l => `${l.nom} (${l.code})`).join(' & ')}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Total Solde Dû</p>
                      <p className="text-base font-extrabold text-amber-400 font-mono">
                        {selectedCopro.totalDu.toLocaleString('fr-FR')} DH
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors"
                      title="Générer et télécharger l'Appel de Fond PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Sélecteur de Template & Langue */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Template */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Type de notification
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={MESSAGE_TEMPLATES.APPEL_FOND_FR}>📢 Appel de Fond Officiel</option>
                      <option value={MESSAGE_TEMPLATES.RAPPEL_COURTOIS_FR}>⏰ Rappel Courtois (Solde)</option>
                      <option value={MESSAGE_TEMPLATES.RELANCE_URGENTE_FR}>⚠️ Relance Urgente (Arriérés)</option>
                      <option value={MESSAGE_TEMPLATES.RECU_PAIEMENT_FR}>✅ Confirmation & Reçu</option>
                    </select>
                  </div>

                  {/* Langue & Numéro */}
                  <div className="flex space-x-2">
                    <div className="w-1/3">
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Langue
                      </label>
                      <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs">
                        <button
                          onClick={() => setLang('FR')}
                          className={`flex-1 py-1 rounded text-center font-medium ${
                            lang === 'FR' ? 'bg-brand-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Français
                        </button>
                        <button
                          onClick={() => setLang('DARIJA')}
                          className={`flex-1 py-1 rounded text-center font-medium ${
                            lang === 'DARIJA' ? 'bg-brand-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          Darija 🇲🇦
                        </button>
                      </div>
                    </div>

                    {/* Sélection du numéro si multiple */}
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Numéro WhatsApp
                      </label>
                      {availablePhones.length > 0 ? (
                        <select
                          value={selectedPhone}
                          onChange={(e) => setSelectedPhone(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        >
                          {availablePhones.map(p => (
                            <option key={p} value={p}>+{p}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Ex: 212661000000"
                          value={selectedPhone}
                          onChange={(e) => setSelectedPhone(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Prévisualisation & Édition du Message */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center space-x-1">
                      <span>Message à envoyer (modifiable en direct) :</span>
                    </label>
                    <button
                      onClick={handleCopy}
                      className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={10}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Boutons d'Action WhatsApp */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                  <div className="text-xs text-slate-400 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>N'oubliez pas de joindre le PDF téléchargé si vous souhaitez joindre la facture !</span>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    {/* WhatsApp Web */}
                    <button
                      onClick={() => handleSendWhatsApp(true)}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>WhatsApp Web</span>
                    </button>

                    {/* WhatsApp Direct wa.me */}
                    <button
                      onClick={() => handleSendWhatsApp(false)}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer via Link (wa.me)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Sélectionnez un copropriétaire dans la liste
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
