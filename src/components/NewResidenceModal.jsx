import React, { useState } from 'react';
import { useSyndic } from '../context/SyndicContext';
import { X, Building2, Plus, Check } from 'lucide-react';

export default function NewResidenceModal() {
  const { activeModal, setActiveModal, addResidence } = useSyndic();

  if (activeModal !== 'nouvelle_residence') return null;

  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('Casablanca');
  const [rib, setRib] = useState('');
  const [banque, setBanque] = useState('BMCE Bank of Africa');
  const [cotisationAppt, setCotisationAppt] = useState('300');
  const [cotisationMagasin, setCotisationMagasin] = useState('150');
  const [totalLots, setTotalLots] = useState('20');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nom || !rib) {
      alert('Veuillez renseigner le nom de la résidence et le RIB.');
      return;
    }

    addResidence({
      nom: nom.toUpperCase(),
      nomCourt: nom.replace('SYNDICAT', '').replace('RESIDENCE', '').trim(),
      adresse,
      ville,
      rib,
      banque,
      compte: nom.toUpperCase(),
      totalLots: Number(totalLots) || 20,
      apptsCount: Math.max(1, Number(totalLots) - 4),
      magasinsCount: 4,
      cotisationAppt: Number(cotisationAppt) || 300,
      cotisationMagasin: Number(cotisationMagasin) || 150
    });

    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden font-sans">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ajouter un Nouvel Immeuble / Résidence
              </h3>
              <p className="text-xs text-slate-500">
                Créez une entité syndicale indépendante avec son RIB et ses tarifs.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Nom complet du Syndicat * :
            </label>
            <input
              type="text"
              required
              placeholder="Ex: SYNDICAT RESIDENCE LES FLEURS"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Adresse :
              </label>
              <input
                type="text"
                placeholder="Ex: Boulevard Ghandi"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Ville :
              </label>
              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Banque :
              </label>
              <select
                value={banque}
                onChange={(e) => setBanque(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
              >
                <option value="BMCE Bank of Africa">BMCE Bank of Africa</option>
                <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                <option value="Banque Populaire">Banque Populaire</option>
                <option value="CIH Bank">CIH Bank</option>
                <option value="Société Générale Maroc">Société Générale Maroc</option>
                <option value="Crédit Agricole du Maroc">Crédit Agricole du Maroc</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nombre de Lots :
              </label>
              <input
                type="number"
                value={totalLots}
                onChange={(e) => setTotalLots(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              RIB Bancaire (24 chiffres) * :
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 011 780 0000402100011545 25"
              value={rib}
              onChange={(e) => setRib(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Cotisation Appt (DH/mois) :
              </label>
              <input
                type="number"
                value={cotisationAppt}
                onChange={(e) => setCotisationAppt(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Cotisation Magasin (DH/mois) :
              </label>
              <input
                type="number"
                value={cotisationMagasin}
                onChange={(e) => setCotisationMagasin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-600/20 transition-all active:scale-95"
            >
              Enregistrer la Résidence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
