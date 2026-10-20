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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Encaisser une Cotisation
              </h2>
              <p className="text-xs text-slate-400">
                Enregistre le paiement et génère automatiquement le reçu syndical.
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

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Sélection du lot */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Lot & Copropriétaire concerné :
            </label>
            <select
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {enrichedLots.map(l => (
                <option key={l.id} value={l.id}>
                  {l.code} - {l.nom} ({l.coproprietaire.nom}) • Reste: {l.totalDu} DH
                </option>
              ))}
            </select>
          </div>

          {/* Raccourcis Trimestre */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 font-medium">Mois concernés :</label>
              <span className="text-[10px] text-slate-500">Remplissage automatique</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {['T1 (Jan-Mar)', 'T2 (Avr-Jui)', 'T3 (Jui-Sep)', 'T4 (Oct-Déc)'].map((t, idx) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => handleSelectTrimestre(idx)}
                  className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] font-medium text-slate-300 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Checkboxes mois individuels */}
            <div className="grid grid-cols-6 gap-1">
              {MOIS_NOMS.map((m, idx) => {
                const isSelected = selectedMonths.includes(idx);
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => toggleMonth(idx)}
                    className={`py-1 text-[10px] font-mono rounded border transition-colors ${
                      isSelected
                        ? 'bg-blue-600/40 text-blue-200 border-blue-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {m.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Montant & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Montant encaissé (DH) * :
              </label>
              <input
                type="number"
                required
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Date de paiement :
              </label>
              <input
                type="date"
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Mode de règlement & Référence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Mode de règlement :
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="virement">Virement bancaire</option>
                <option value="cheque">Chèque bancaire</option>
                <option value="especes">Espèces</option>
                <option value="versement">Versement espèces</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Réf. / N° Chèque :
              </label>
              <input
                type="text"
                placeholder="Ex: VIR-849202 ou CHQ-0921"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Option Reçu */}
          <div className="pt-2">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={generateReceipt}
                onChange={(e) => setGenerateReceipt(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
              />
              <span className="font-medium">Télécharger immédiatement le Reçu de Paiement (PDF)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              Enregistrer le Paiement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
