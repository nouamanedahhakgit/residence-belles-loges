import React, { useState, useMemo } from 'react';
import { useSyndic } from '../context/SyndicContext';
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileText, 
  CreditCard, 
  Phone, 
  Copy, 
  Check, 
  LogOut, 
  ShieldCheck, 
  MessageSquare,
  Lock,
  ArrowRight
} from 'lucide-react';
import { generateAppelDeFondPDF, generateRecuPaiementPDF } from '../lib/pdfGenerator';
import { nombreEnLettres } from '../lib/numberToWords';

const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function ClientPortal() {
  const { 
    enrichedLots, 
    residence, 
    selectedYear, 
    clientSession, 
    loginClient, 
    logoutClient, 
    switchToAdmin 
  } = useSyndic();

  // Login form state (si non connecté)
  const [lotCodeInput, setLotCodeInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [copiedRib, setCopiedRib] = useState(false);

  // Lots appartenant au copropriétaire connecté
  const clientLots = useMemo(() => {
    if (!clientSession) return [];
    return enrichedLots.filter(l => 
      l.coproprietaire.nom === clientSession.nom ||
      l.code.toLowerCase() === (clientSession.lotCode || '').toLowerCase()
    );
  }, [enrichedLots, clientSession]);

  // Totaux consolidés du client
  const clientSummary = useMemo(() => {
    let totalPaye = 0;
    let resteAnnuel = 0;
    let arrieres = 0;
    let totalExige = 0;

    clientLots.forEach(l => {
      totalPaye += l.totalPaye;
      resteAnnuel += Math.max(0, l.resteAnnuel);
      arrieres += l.arrieres;
      totalExige += l.cotisation.montant_annuel || 0;
    });

    const totalDu = resteAnnuel + arrieres;
    const isAJour = totalDu === 0;

    return {
      totalPaye,
      resteAnnuel,
      arrieres,
      totalExige,
      totalDu,
      isAJour
    };
  }, [clientLots]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    const success = loginClient(lotCodeInput, pinInput);
    if (!success) {
      setLoginError('Lot ou Code PIN incorrect. Veuillez vérifier auprès du Syndic.');
    }
  };

  const handleCopyRib = () => {
    navigator.clipboard.writeText(residence.rib);
    setCopiedRib(true);
    setTimeout(() => setCopiedRib(false), 2000);
  };

  const handleDownloadAppelPDF = () => {
    if (clientLots.length === 0) return;
    const firstLot = clientLots[0];
    generateAppelDeFondPDF({
      coproprietaireNom: firstLot.coproprietaire.nom,
      lots: clientLots.map(l => ({
        code: l.code,
        nom: l.nom,
        montant: l.type === 'magasin' ? 1800 : (l.resteAnnuel > 0 ? l.resteAnnuel : 900),
        observation: `Exercice ${selectedYear}`
      })),
      arrieres: clientSummary.arrieres,
      rib: residence.rib,
      residenceNom: residence.nom,
      residenceAdresse: residence.adresse
    });
  };

  // 1. Écran de Connexion Client (Si pas encore connecté)
  if (!clientSession) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-6 sm:p-8 max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Espace Copropriétaire Privé
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {residence.nom} • Casablanca
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Numéro de Lot ou Téléphone :
              </label>
              <input
                type="text"
                required
                placeholder="Ex: M02, A12 ou 0669791313"
                value={lotCodeInput}
                onChange={(e) => setLotCodeInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code PIN (4 chiffres) :
              </label>
              <input
                type="password"
                placeholder="Ex: 1313 (ou les 4 derniers chiffres du tél)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 font-mono tracking-widest"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Par défaut : 4 derniers chiffres de votre téléphone.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow-md shadow-brand-600/20 transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <span>Accéder à mon Compte</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              onClick={switchToAdmin}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              ← Retour au Panneau d'Administration
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Portail Client Connecté (Interface claire, moderne et intuitive)
  const primaryLot = clientLots[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in font-sans">
      {/* Barre supérieure Espace Copropriétaire */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shadow-sm shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                {residence.nom}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Espace Sécurisé
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bienvenue sur votre espace privé • Exercice {selectedYear}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* WhatsApp Direct avec le Syndic */}
          <a
            href="https://wa.me/212669281802?text=Salam%20Syndic%2C%20j%27ai%20une%20question%20concernant%20mon%20lot"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contacter le Syndic</span>
          </a>

          {/* Déconnexion */}
          <button
            onClick={logoutClient}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Quitter</span>
          </button>
        </div>
      </div>

      {/* Bannière de Bienvenue Personnalisée */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Compte Copropriétaire Actif
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
              {clientSession.nom}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Lot(s) associé(s) : <span className="font-semibold text-white">{clientLots.map(l => `${l.nom} (${l.code})`).join(' • ')}</span>
              {primaryLot?.etage && ` • Étage : ${primaryLot.etage}`}
            </p>
          </div>

          {/* Bouton de Téléchargement Direct de l'Appel de Fond */}
          <button
            onClick={handleDownloadAppelPDF}
            className="flex items-center space-x-2 bg-brand-500 hover:bg-brand-400 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-brand-500/30 transition-all active:scale-98 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger mon Appel de Fond (PDF)</span>
          </button>
        </div>
      </div>

      {/* Cartes KPI Situation Financière */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Statut Global */}
        <div className={`p-5 rounded-2xl border transition-all ${
          clientSummary.isAJour
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Situation du Compte</span>
            {clientSummary.isAJour ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold font-mono tracking-tight">
              {clientSummary.totalDu.toLocaleString('fr-FR')} DH
            </span>
            <p className="text-xs font-semibold mt-1">
              {clientSummary.isAJour 
                ? '🎉 Félicitations, vous êtes parfaitement à jour !' 
                : 'Solde restant à régler pour l\'exercice en cours'}
            </p>
          </div>
        </div>

        {/* Total Payé */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Cotisations Réglées ({selectedYear})</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {clientSummary.totalPaye.toLocaleString('fr-FR')} DH
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Sur un budget total de {clientSummary.totalExige.toLocaleString('fr-FR')} DH
            </p>
          </div>
        </div>

        {/* Arriérés Antérieurs */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Arriérés Exercices Précédents</span>
            <span className="text-xs text-slate-400">2024 - 2025</span>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-extrabold font-mono tracking-tight ${
              clientSummary.arrieres > 0 ? 'text-red-600' : 'text-slate-900'
            }`}>
              {clientSummary.arrieres.toLocaleString('fr-FR')} DH
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {clientSummary.arrieres > 0 ? 'Impayés reportés à régulariser' : 'Aucun arriéré antérieur'}
            </p>
          </div>
        </div>
      </div>

      {/* Calendrier Matriciel des 12 Mois (Tableau Simple & Lisible) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Détail de vos Cotisations Mensuelles ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              État d'encaissement mois par mois pour votre/vos bien(s).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {MOIS_NOMS.map((nomMois, idx) => {
            // Calculer montant cumulé sur les lots du client pour ce mois
            let payeCeMois = 0;
            let exigeCeMois = 0;

            clientLots.forEach(l => {
              const val = Number(l.cotisation.months[idx]) || 0;
              payeCeMois += val;
              exigeCeMois += (l.type === 'magasin' ? 150 : 300);
            });

            const isPaye = payeCeMois >= exigeCeMois && exigeCeMois > 0;
            const isPartiel = payeCeMois > 0 && payeCeMois < exigeCeMois;

            return (
              <div 
                key={nomMois}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isPaye 
                    ? 'bg-emerald-50/70 border-emerald-200' 
                    : isPartiel 
                      ? 'bg-amber-50/70 border-amber-200' 
                      : 'bg-slate-50 border-slate-200/70'
                }`}
              >
                <p className="text-[11px] font-bold text-slate-700">{nomMois}</p>
                <p className={`text-sm font-mono font-extrabold mt-1 ${
                  isPaye ? 'text-emerald-700' : isPartiel ? 'text-amber-700' : 'text-slate-400'
                }`}>
                  {payeCeMois} DH
                </p>
                <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full mt-1.5 ${
                  isPaye 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : isPartiel 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-slate-200 text-slate-600'
                }`}>
                  {isPaye ? 'RÉGLÉ' : isPartiel ? 'PARTIEL' : 'EN ATTENTE'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coordonnées Bancaires Officielles pour Virement */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-emerald-950 flex items-center space-x-1.5">
              <span>Coordonnées Bancaires de la Résidence pour Virement</span>
            </h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              Compte officiel ouvert auprès de {residence.banque} à Casablanca.
            </p>
            
            <div className="mt-3 space-y-1 text-xs text-slate-700">
              <p>• <strong>Bénéficiaire :</strong> {residence.nom}</p>
              <p>• <strong>Banque :</strong> {residence.banque}</p>
              <p>• <strong>Motif conseillé :</strong> <code className="bg-white px-2 py-0.5 rounded border border-emerald-200 font-mono text-emerald-800 font-bold">{clientLots[0]?.code} - {clientSession.nom}</code></p>
            </div>
          </div>

          {/* Encart RIB avec bouton Copier */}
          <div className="bg-white border border-emerald-300 rounded-xl p-3.5 shadow-sm text-center sm:text-right shrink-0">
            <p className="text-[10px] uppercase font-bold text-slate-500">RIB Bancaire (24 Chiffres)</p>
            <p className="font-mono font-extrabold text-sm sm:text-base text-slate-900 tracking-wider my-1 select-all">
              {residence.rib}
            </p>
            <button
              onClick={handleCopyRib}
              className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-semibold hover:text-emerald-800 transition-colors"
            >
              {copiedRib ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRib ? 'RIB Copié dans le presse-papier !' : 'Copier le RIB'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
