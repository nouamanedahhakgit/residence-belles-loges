import React, { useState } from 'react';
import { useSyndic } from '../context/SyndicContext';
import { 
  X, 
  CreditCard, 
  Check, 
  Receipt, 
  Calendar, 
  Building 
} from 'lucide-react';
import { generateRecuPaiementPDF } from '../lib/pdfGenerator';
import confetti from 'canvas-confetti';

const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function PaymentModal() {
  const { 
    activeModal, 
    setActiveModal, 
    modalPayload, 
    enrichedLots, 
    selectedYear, 
    recordPayment,
    residence 
  } = useSyndic();

  if (activeModal !== 'paiement') return null;

  const defaultLot = modalPayload || enrichedLots[0];

  const [lotId, setLotId] = useState(defaultLot?.id || '');
  const [montant, setMontant] = useState(defaultLot?.type === 'magasin' ? '450' : '900'); // default 1 trimestre
  const [modePaiement, setModePaiement] = useState('virement');
  const [reference, setReference] = useState('');
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [remarques, setRemarques] = useState('');
  const [generateReceipt, setGenerateReceipt] = useState(true);

  const currentLot = enrichedLots.find(l => l.id === lotId) || defaultLot;

  const toggleMonth = (mIdx) => {
    if (selectedMonths.includes(mIdx)) {
      setSelectedMonths(selectedMonths.filter(m => m !== mIdx));
    } else {
      setSelectedMonths([...selectedMonths, mIdx]);
    }
  };

  const handleSelectTrimestre = (tIdx) => {
    const start = tIdx * 3;
    const months = [start, start + 1, start + 2];
    setSelectedMonths(months);
    const tarif = currentLot?.type === 'magasin' ? 150 : 300;
    setMontant(String(tarif * 3));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!montant || Number(montant) <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }

    recordPayment({
      lotId,
      montant: Number(montant),
      modePaiement,
      reference,
      datePaiement,
      moisPayes: selectedMonths,
      remarques
    });

    // Confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    // Optionnel: Générer le reçu en PDF
    if (generateReceipt && currentLot) {
      generateRecuPaiementPDF({
        coproprietaireNom: currentLot.coproprietaire.nom,
        lotNumero: currentLot.nom,
        lotCode: currentLot.code,
        montant: Number(montant),
        modePaiement: modePaiement === 'virement' ? 'Virement bancaire' : modePaiement === 'cheque' ? 'Chèque' : 'Espèces',
        reference: reference || 'N/A',
        periode: selectedMonths.length > 0 
          ? selectedMonths.map(m => MOIS_NOMS[m]).join(', ') + ` ${selectedYear}`
          : `Cotisation ${selectedYear}`,
        residenceNom: residence.nom,
        residenceAdresse: residence.adresse,
        rib: residence.rib
      });
    }

    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Encaisser un Règlement
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enregistre le paiement sur l'écran, dans Supabase et génère le reçu PDF.
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

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Sélection du lot */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Lot & Copropriétaire concerné :
            </label>
            <select
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-500"
            >
              {enrichedLots.map(l => (
                <option key={l.id} value={l.id}>
                  {l.code} - {l.nom} ({l.coproprietaire.nom}) • Dû : {l.totalDu} DH
                </option>
              ))}
            </select>
          </div>

          {/* Raccourci Trimestres */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Raccourci Période ({selectedYear}) :
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['T1 (Jan-Mar)', 'T2 (Avr-Juin)', 'T3 (Juil-Sep)', 'T4 (Oct-Déc)'].map((label, tIdx) => (
                <button
                  type="button"
                  key={tIdx}
                  onClick={() => handleSelectTrimestre(tIdx)}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-semibold transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Montant & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Montant encaissé (DH) * :
              </label>
              <input
                type="number"
                required
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Date de valeur :
              </label>
              <input
                type="date"
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Mode de paiement & Référence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Mode de règlement :
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-500"
              >
                <option value="virement">Virement bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="versement">Versement espèces</option>
                <option value="especes">Espèces direct</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                N° Chèque / Réf Virement :
              </label>
              <input
                type="text"
                placeholder="Ex: CHQ 894125 ou VIR BMCE"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          {/* Reçu checkbox */}
          <div className="pt-2">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={generateReceipt}
                onChange={(e) => setGenerateReceipt(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-0"
              />
              <span className="font-semibold">Télécharger automatiquement le Reçu de Paiement officiel (PDF)</span>
            </label>
          </div>

          {/* Boutons */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-600/20 transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Valider l'Encaissement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
