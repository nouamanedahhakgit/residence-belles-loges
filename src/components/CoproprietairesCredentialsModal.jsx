import React, { useState, useMemo } from 'react';
import { useSyndic } from '../context/SyndicContext';
import { 
  X, 
  KeyRound, 
  UserCheck, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageSquare, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Edit3, 
  Save, 
  Printer, 
  Eye, 
  Lock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatWhatsAppPhones } from '../lib/whatsapp';

export default function CoproprietairesCredentialsModal() {
  const { 
    enrichedLots, 
    coproprietaires, 
    activeModal, 
    setActiveModal, 
    setModalPayload,
    updateCoproprietairePin, 
    updateCoproprietairePhone,
    switchToClient,
    residence 
  } = useSyndic();

  if (activeModal !== 'credentials') return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhone, setFilterPhone] = useState('all'); // 'all', 'with_phone', 'no_phone'
  const [copiedKey, setCopiedKey] = useState(null);
  const [editingPinId, setEditingPinId] = useState(null);
  const [tempPin, setTempPin] = useState('');
  const [editingPhoneId, setEditingPhoneId] = useState(null);
  const [tempPhone, setTempPhone] = useState('');

  // Regrouper les lots par copropriétaire pour avoir 1 ligne par propriétaire
  const coproprietairesComptes = useMemo(() => {
    const map = {};

    enrichedLots.forEach(lot => {
      const cNom = lot.coproprietaire.nom;
      const cId = lot.copro_id || cNom;

      if (!map[cNom]) {
        const rawTel = lot.coproprietaire.tel || '';
        const defaultPin = lot.coproprietaire.pin || (rawTel ? rawTel.replace(/[^\d]/g, '').slice(-4) : '1234');

        map[cNom] = {
          id: cId,
          nom: cNom,
          tel: rawTel,
          pin: defaultPin,
          lots: [],
          totalDu: 0
        };
      }

      map[cNom].lots.push(lot);
      map[cNom].totalDu += lot.totalDu;
    });

    return Object.values(map);
  }, [enrichedLots]);

  // Filtrage
  const filteredComptes = useMemo(() => {
    return coproprietairesComptes.filter(c => {
      if (filterPhone === 'with_phone' && !c.tel) return false;
      if (filterPhone === 'no_phone' && c.tel) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNom = c.nom.toLowerCase().includes(q);
        const matchTel = c.tel.includes(q);
        const matchPin = c.pin.includes(q);
        const matchLot = c.lots.some(l => l.code.toLowerCase().includes(q) || l.nom.toLowerCase().includes(q));
        if (!matchNom && !matchTel && !matchPin && !matchLot) return false;
      }

      return true;
    });
  }, [coproprietairesComptes, searchTerm, filterPhone]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStartEditPin = (c) => {
    setEditingPinId(c.id);
    setTempPin(c.pin || '1234');
  };

  const handleSavePin = async (cId) => {
    if (tempPin.trim()) {
      await updateCoproprietairePin(cId, tempPin.trim());
    }
    setEditingPinId(null);
  };

  const handleStartEditPhone = (c) => {
    setEditingPhoneId(c.id);
    setTempPhone(c.tel || '');
  };

  const handleSavePhone = async (cId) => {
    await updateCoproprietairePhone(cId, tempPhone.trim());
    setEditingPhoneId(null);
  };

  const handleSendWhatsAppAccess = (compte) => {
    setModalPayload({ coproprietaire: compte, nom: compte.nom });
    setActiveModal('whatsapp');
  };

  const handleTestClientPortal = (lotCode) => {
    setActiveModal(null);
    switchToClient(lotCode);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header modale */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Annuaire des Comptes & Mots de Passe des Copropriétaires
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  {coproprietairesComptes.length} Comptes
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Retrouvez tous les Identifiants (Usernames), Codes PIN (Mots de passe) et Liens Magiques à transmettre aux copropriétaires.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
              title="Imprimer cette feuille d'identifiants"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bannière explicative "Comment ça marche" */}
        <div className="bg-brand-50/70 dark:bg-brand-950/30 border-b border-brand-200/80 dark:border-brand-900/50 p-4 text-xs text-brand-950 dark:text-brand-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900 dark:text-white">
                Règles de connexion pour les Copropriétaires :
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                • <strong>Nom d'utilisateur (Username) :</strong> Le client peut saisir soit son <strong>Code Lot</strong> (ex: <code className="bg-white px-1 py-0.5 rounded border border-brand-200 font-mono font-bold text-brand-700">M02</code> ou <code className="bg-white px-1 py-0.5 rounded border border-brand-200 font-mono font-bold text-brand-700">A12</code>) soit son <strong>Téléphone</strong>.
                <br />
                • <strong>Mot de passe (Password) :</strong> Son <strong>Code PIN à 4 chiffres</strong> (modifiable en direct par l'admin ci-dessous).
                <br />
                • <strong>Lien Magique :</strong> Permet au client de se connecter automatiquement sans mot de passe en 1 clic !
              </p>
            </div>
          </div>
        </div>

        {/* Barre de recherche & filtres */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par copropriétaire, lot (M02, A10), tél ou code PIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Filtrer :</span>
            <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setFilterPhone('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterPhone === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tous ({coproprietairesComptes.length})
              </button>
              <button
                onClick={() => setFilterPhone('with_phone')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterPhone === 'with_phone' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Avec Téléphone
              </button>
              <button
                onClick={() => setFilterPhone('no_phone')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterPhone === 'no_phone' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sans Téléphone
              </button>
            </div>
          </div>
        </div>

        {/* Tableau des Comptes Copropriétaires */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider sticky top-0 z-10">
                <th className="py-3 px-3">Copropriétaire</th>
                <th className="py-3 px-3">Bien(s) Associé(s)</th>
                <th className="py-3 px-3">Nom d'Utilisateur (Login)</th>
                <th className="py-3 px-3">Mot de Passe (Code PIN)</th>
                <th className="py-3 px-3">Lien Magique Direct</th>
                <th className="py-3 px-3 text-center">Actions d'Accès</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
              {filteredComptes.map((c, idx) => {
                const primaryLot = c.lots[0];
                const primaryLotCode = primaryLot?.code || 'lot';
                const magicUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://srbl.netlify.app'}/?client=${encodeURIComponent(primaryLotCode)}`;
                const isEven = idx % 2 === 0;

                return (
                  <tr 
                    key={c.nom}
                    className={`hover:bg-brand-50/40 dark:hover:bg-slate-800/40 transition-colors ${
                      isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-900/40'
                    }`}
                  >
                    {/* Copropriétaire */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {c.nom}
                      </div>
                      
                      {/* Téléphone (avec édition rapide si absent) */}
                      <div className="mt-1 flex items-center space-x-1.5 text-[11px]">
                        {editingPhoneId === c.id ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={tempPhone}
                              onChange={(e) => setTempPhone(e.target.value)}
                              placeholder="0661000000"
                              className="w-28 px-1.5 py-0.5 bg-white border border-brand-500 rounded text-xs font-mono"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePhone(c.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Enregistrer téléphone"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPhoneId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {c.tel ? (
                              <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{c.tel}</span>
                            ) : (
                              <button 
                                onClick={() => handleStartEditPhone(c)}
                                className="text-amber-600 hover:underline italic flex items-center space-x-0.5"
                              >
                                <span>+ Ajouter un tél</span>
                              </button>
                            )}
                            {c.tel && (
                              <button 
                                onClick={() => handleStartEditPhone(c)}
                                className="text-slate-400 hover:text-slate-600 ml-1"
                                title="Modifier le numéro de téléphone"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Lots associés */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {c.lots.map(l => (
                          <span 
                            key={l.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                          >
                            <span>{l.code}</span>
                            <span className="text-[10px] text-slate-400 ml-1 font-normal font-sans">({l.etage})</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Nom d'utilisateur (Login) */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Par Lot :</span>
                          <span className="font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded text-xs select-all">
                            {c.lots.map(l => l.code).join(' ou ')}
                          </span>
                        </div>
                        {c.tel && (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Par Tél :</span>
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] select-all">
                              {c.tel.split('/')[0].trim()}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Mot de Passe (Code PIN) */}
                    <td className="py-3 px-3">
                      {editingPinId === c.id ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            maxLength={8}
                            value={tempPin}
                            onChange={(e) => setTempPin(e.target.value)}
                            className="w-20 px-2 py-1 bg-white border-2 border-brand-500 rounded-lg text-sm font-mono font-extrabold text-slate-900 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePin(c.id)}
                            className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors"
                            title="Sauvegarder le code PIN"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPinId(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-extrabold text-sm text-slate-900 dark:text-white tracking-widest select-all">
                            {c.pin}
                          </div>
                          <button
                            onClick={() => handleCopy(c.pin, `pin-${c.nom}`)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copier le code PIN"
                          >
                            {copiedKey === `pin-${c.nom}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleStartEditPin(c)}
                            className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                            title="Modifier ce mot de passe / PIN"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Lien Magique Direct */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopy(magicUrl, `url-${c.nom}`)}
                          className="flex items-center space-x-1.5 px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-semibold transition-colors"
                          title="Copier le lien d'accès direct"
                        >
                          {copiedKey === `url-${c.nom}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="font-mono text-[11px]">?client={primaryLotCode}</span>
                        </button>
                      </div>
                    </td>

                    {/* Actions d'Accès Rapides */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Envoyer par WhatsApp */}
                        <button
                          onClick={() => handleSendWhatsAppAccess(c)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                          title="Envoyer les identifiants et le lien magique via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Envoyer WhatsApp</span>
                        </button>

                        {/* Tester la connexion en tant que ce client */}
                        <button
                          onClick={() => handleTestClientPortal(primaryLotCode)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Tester et voir l'Espace Copropriétaire comme le client le voit"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden xl:inline">Tester</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Total affiché : <strong>{filteredComptes.length} copropriétaires</strong> • Synchronisé en direct avec Supabase.
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
            >
              Fermer l'Annuaire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
