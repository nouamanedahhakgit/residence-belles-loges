import React, { useState } from 'react';
import { useSyndic } from '../context/SyndicContext';
import { 
  X, 
  Download, 
  Printer, 
  MessageSquare, 
  Building2, 
  Calendar, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { generateAppelDeFondPDF } from '../lib/pdfGenerator';
import { nombreEnLettres } from '../lib/numberToWords';

export default function AppelDeFondModal() {
  const { 
    activeModal, 
    setActiveModal, 
    modalPayload, 
    residence, 
    selectedYear,
    enrichedLots 
  } = useSyndic();

  if (activeModal !== 'appel_fond') return null;

  const initialLot = modalPayload || enrichedLots[0];

  // Trouver tous les lots appartenant au même copropriétaire
  const coproLots = enrichedLots.filter(
    l => l.coproprietaire.nom === (initialLot.coproprietaire?.nom || initialLot.nom)
  );

  // État local
  const [selectedLotIds, setSelectedLotIds] = useState(
    coproLots.map(l => l.id)
  );
  const [periodeObservation, setPeriodeObservation] = useState(`Exercice ${selectedYear}`);
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().split('T')[0]);
  const [includeArrieres, setIncludeArrieres] = useState(true);

  // Calcul des montants
  const lotsConcernes = coproLots.filter(l => selectedLotIds.includes(l.id));

  let totalCourant = 0;
  let totalArrieres = 0;

  lotsConcernes.forEach(l => {
    const tarif = l.type === 'magasin' ? 1800 : (l.resteAnnuel > 0 ? l.resteAnnuel : 900);
    totalCourant += tarif;
    if (includeArrieres) {
      totalArrieres += l.arrieres;
    }
  });

  const grandTotal = totalCourant + totalArrieres;
  const montantEnLettres = nombreEnLettres(grandTotal);

  const toggleLot = (id) => {
    if (selectedLotIds.includes(id)) {
      if (selectedLotIds.length > 1) {
        setSelectedLotIds(selectedLotIds.filter(x => x !== id));
      }
    } else {
      setSelectedLotIds([...selectedLotIds, id]);
    }
  };

  const handleDownload = () => {
    generateAppelDeFondPDF({
      numeroRef: `AF-${selectedYear}-${initialLot.code}`,
      dateEmission: new Date(dateEmission).toLocaleDateString('fr-FR'),
      coproprietaireNom: initialLot.coproprietaire.nom,
      lots: lotsConcernes.map(l => ({
        code: l.code,
        nom: l.nom,
        montant: l.type === 'magasin' ? 1800 : (l.resteAnnuel > 0 ? l.resteAnnuel : 900),
        observation: periodeObservation
      })),
      arrieres: includeArrieres ? totalArrieres : 0,
      rib: residence.rib,
      residenceNom: residence.nom,
      residenceAdresse: residence.adresse
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header modale */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Génération de l'Appel de Fond Officiel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Génération instantanée du PDF vectoriel haute définition conforme aux normes juridiques.
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

        {/* Options & Configuration */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Sélection des lots si copropriétaire multi-lots */}
          <div>
            <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">
              Lot(s) inclus ({coproLots.length}) :
            </label>
            <div className="flex flex-wrap gap-1.5">
              {coproLots.map(l => (
                <button
                  key={l.id}
                  onClick={() => toggleLot(l.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    selectedLotIds.includes(l.id)
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {l.code} ({l.nom})
                </button>
              ))}
            </div>
          </div>

          {/* Période / Observation */}
          <div>
            <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">
              Période concernée :
            </label>
            <input
              type="text"
              value={periodeObservation}
              onChange={(e) => setPeriodeObservation(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Date & Arriérés */}
          <div className="flex items-center space-x-3 pt-4 sm:pt-0">
            <div className="flex-1">
              <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">
                Date d'émission :
              </label>
              <input
                type="date"
                value={dateEmission}
                onChange={(e) => setDateEmission(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <label className="flex items-center space-x-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 mt-5 font-semibold">
              <input
                type="checkbox"
                checked={includeArrieres}
                onChange={(e) => setIncludeArrieres(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <span>Inclure arriérés</span>
            </label>
          </div>
        </div>

        {/* Prévisualisation Papier (Style Feuille A4 Réelle de l'Excel) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-950 flex justify-center">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-lg p-6 sm:p-8 font-sans border border-slate-200">
            {/* Header Document */}
            <div className="text-center border-b pb-4 mb-4">
              <h3 className="text-base sm:text-lg font-extrabold tracking-wide text-slate-900">
                {residence.nom}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {residence.adresse}
              </p>
              <p className="text-[10px] text-slate-500 italic mt-0.5">
                Loi 18-00 régissant le statut de la copropriété au Maroc
              </p>
            </div>

            {/* Titre & Date */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold text-slate-800 mb-4 pb-2 border-b">
              <span>APPEL DE FOND DES CHARGES COMMUNES DE LA COPROPRIÉTÉ N° A{selectedYear}</span>
              <span className="text-slate-600">Le {new Date(dateEmission).toLocaleDateString('fr-FR')}</span>
            </div>

            {/* Nom Destinataire */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
              <p className="text-xs font-bold text-slate-900">{initialLot.coproprietaire.nom}</p>
              <p className="text-xs text-slate-600 mt-1 italic">
                Merci de trouver ci-joint le détail de votre contribution :
              </p>
            </div>

            {/* Tableau Officiel */}
            <table className="w-full text-xs border border-slate-300 mb-4 rounded overflow-hidden">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                  <th className="p-2 text-left border-r border-slate-300">DÉSIGNATION</th>
                  <th className="p-2 text-center border-r border-slate-300">N° DE LOT</th>
                  <th className="p-2 text-right border-r border-slate-300">MONTANT</th>
                  <th className="p-2 text-left">OBSERVATION</th>
                </tr>
              </thead>
              <tbody>
                {lotsConcernes.map(l => (
                  <tr key={l.id} className="border-b border-slate-200">
                    <td className="p-2 border-r border-slate-200">Prévisions des charges communes</td>
                    <td className="p-2 text-center font-mono font-semibold border-r border-slate-200">{l.code}</td>
                    <td className="p-2 text-right font-mono font-bold border-r border-slate-200">
                      {(l.type === 'magasin' ? 1800 : (l.resteAnnuel > 0 ? l.resteAnnuel : 900)).toLocaleString('fr-FR')} DH
                    </td>
                    <td className="p-2 text-slate-700">{periodeObservation}</td>
                  </tr>
                ))}
                {includeArrieres && totalArrieres > 0 && (
                  <tr className="border-b border-slate-200 bg-red-50 text-red-700">
                    <td className="p-2 border-r border-slate-200 font-semibold">Arriérés d’exercices antérieurs</td>
                    <td className="p-2 text-center border-r border-slate-200">-</td>
                    <td className="p-2 text-right font-mono font-bold border-r border-slate-200">
                      {totalArrieres.toLocaleString('fr-FR')} DH
                    </td>
                    <td className="p-2">Impayés consolidés</td>
                  </tr>
                )}
                {/* Total */}
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td className="p-2 border-r border-slate-300 text-left" colSpan={2}>TOTAL À PAYER</td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-sm text-emerald-700">
                    {grandTotal.toLocaleString('fr-FR')} DH
                  </td>
                  <td className="p-2"></td>
                </tr>
              </tbody>
            </table>

            {/* Montant en toutes lettres */}
            <div className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-slate-800">
              <span className="font-semibold">Arrêter le présent appel de fond à la somme de : </span>
              <span className="font-bold text-slate-900 underline decoration-slate-400">{montantEnLettres}</span>
            </div>

            {/* Modalités & RIB */}
            <div className="text-[11px] bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 mb-4 text-emerald-950">
              <p className="font-bold uppercase tracking-wider mb-1">
                Le règlement doit se faire sur le compte bancaire de la résidence ou par chèque :
              </p>
              <p className="font-semibold">LIBELLÉ DU COMPTE : {residence.nom}</p>
              <p className="font-mono font-bold text-xs mt-1 text-slate-900">RIB : {residence.rib}</p>
            </div>

            {/* Signature */}
            <div className="flex justify-end pt-2 text-xs">
              <div className="text-center w-52">
                <p className="font-bold text-slate-800">Pour le Syndicat</p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">Le Bureau du Syndic</p>
                <div className="mt-2 h-14 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-[10px] text-slate-400">
                  Cachet & Visa
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Total calculé : <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">{grandTotal.toLocaleString('fr-FR')} DH</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Basculer vers WhatsApp */}
            <button
              onClick={() => {
                setActiveModal('whatsapp');
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Transmettre par WhatsApp</span>
            </button>

            {/* Imprimer */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>

            {/* Télécharger PDF */}
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger PDF Officiel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
