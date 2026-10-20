import React, { useState } from 'react';
import { useSyndic } from '../context/SyndicContext';
import { 
  FileText, 
  MessageSquare, 
  CreditCard, 
  Search, 
  Filter, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Building,
  Store,
  Maximize2
} from 'lucide-react';
import { generateAppelDeFondPDF } from '../lib/pdfGenerator';

const MOIS_NOMS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

export default function CotisationsMatrix() {
  const { 
    filteredLots, 
    selectedYear, 
    updateMonthlyPayment, 
    filterStatus, 
    setFilterStatus,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    setActiveModal,
    setModalPayload,
    residence
  } = useSyndic();

  // Édition inline de cellule
  const [editingCell, setEditingCell] = useState(null); // { lotId, monthIdx }
  const [tempValue, setTempValue] = useState('');

  const startEdit = (lotId, monthIdx, currentValue) => {
    setEditingCell({ lotId, monthIdx });
    setTempValue(String(currentValue || ''));
  };

  const saveEdit = (lotId, monthIdx) => {
    updateMonthlyPayment(lotId, monthIdx, tempValue);
    setEditingCell(null);
  };

  const handleKeyDown = (e, lotId, monthIdx) => {
    if (e.key === 'Enter') {
      saveEdit(lotId, monthIdx);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Calcul des totaux par mois
  const monthlyTotals = Array(12).fill(0);
  filteredLots.forEach(lot => {
    (lot.cotisation.months || []).forEach((val, idx) => {
      monthlyTotals[idx] += Number(val) || 0;
    });
  });

  const totalPayeSum = filteredLots.reduce((acc, l) => acc + l.totalPaye, 0);
  const totalResteSum = filteredLots.reduce((acc, l) => acc + Math.max(0, l.resteAnnuel), 0);
  const totalArrieresSum = filteredLots.reduce((acc, l) => acc + l.arrieres, 0);
  const totalDuSum = filteredLots.reduce((acc, l) => acc + l.totalDu, 0);

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Barre de contrôle & Filtres */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par copropriétaire, lot (M02, A10) ou tél..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Filtres par statut & type */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Statut */}
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700/80 text-xs">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'a_jour', label: 'À jour' },
              { id: 'retard', label: 'Partiel' },
              { id: 'impaye', label: 'Impayé' },
              { id: 'arrieres', label: 'Arriérés' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filterStatus === tab.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Lot */}
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700/80 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filterType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterType('appartement')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1 ${
                filterType === 'appartement' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-3 h-3" />
              <span>Appts</span>
            </button>
            <button
              onClick={() => setFilterType('magasin')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center space-x-1 ${
                filterType === 'magasin' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Store className="w-3 h-3" />
              <span>Magasins</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grille Matricielle Pleine Largeur (Full-Width Responsive Table) */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-800/90 border-b border-slate-700 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              {/* Lot */}
              <th className="py-2.5 px-2.5 sticky left-0 z-20 bg-slate-800/95 backdrop-blur-sm min-w-[75px] w-[6%]">
                Lot / Ét.
              </th>
              {/* Copropriétaire */}
              <th className="py-2.5 px-3 sticky left-[75px] z-20 bg-slate-800/95 backdrop-blur-sm min-w-[170px] w-[18%]">
                Copropriétaire
              </th>
              {/* 12 Mois */}
              {MOIS_NOMS.map((m) => (
                <th key={m} className="py-2.5 px-1 text-center min-w-[42px] font-mono text-[10px] text-slate-400">
                  {m}
                </th>
              ))}
              {/* Payé */}
              <th className="py-2.5 px-2 text-right font-semibold text-emerald-400 min-w-[65px] w-[6%] bg-emerald-950/10">
                Payé
              </th>
              {/* Reste */}
              <th className="py-2.5 px-2 text-right font-semibold text-amber-400 min-w-[65px] w-[6%] bg-amber-950/10">
                Reste {selectedYear}
              </th>
              {/* Arriérés */}
              <th className="py-2.5 px-2 text-right font-semibold text-red-400 min-w-[65px] w-[6%] bg-red-950/10">
                Arriérés
              </th>
              {/* Total Dû */}
              <th className="py-2.5 px-2.5 text-right font-bold text-white min-w-[75px] w-[7%] bg-slate-800/60">
                Total Dû
              </th>
              {/* Actions Rapides */}
              <th className="py-2.5 px-2 text-center min-w-[95px] w-[7%]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredLots.map((lot, rIdx) => {
              const isEven = rIdx % 2 === 0;
              const isMag = lot.type === 'magasin';
              const tarifNormal = isMag ? 150 : 300;

              return (
                <tr 
                  key={lot.id} 
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isEven ? 'bg-transparent' : 'bg-slate-900/30'
                  }`}
                >
                  {/* Code Lot & Étage */}
                  <td className="py-2 px-2.5 sticky left-0 z-10 bg-slate-900/90 backdrop-blur-sm font-semibold text-slate-200">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        lot.totalDu === 0 
                          ? 'bg-emerald-400' 
                          : lot.totalPaye > 0 
                            ? 'bg-amber-400' 
                            : 'bg-red-400'
                      }`} />
                      <span className="font-mono text-white text-xs">{lot.code}</span>
                      <span className="text-[10px] text-slate-400 px-1 py-0.5 rounded bg-slate-800 font-mono">
                        {lot.etage}
                      </span>
                    </div>
                  </td>

                  {/* Nom du Copropriétaire & Tél */}
                  <td className="py-2 px-3 sticky left-[75px] z-10 bg-slate-900/90 backdrop-blur-sm">
                    <div className="font-semibold text-slate-100 text-xs leading-tight" title={lot.coproprietaire.nom}>
                      {lot.coproprietaire.nom}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                      {lot.coproprietaire.tel ? (
                        <span className="flex items-center space-x-1 text-slate-400 hover:text-emerald-400 font-mono">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{lot.coproprietaire.tel.split('/')[0]}</span>
                        </span>
                      ) : (
                        <span className="italic text-slate-500">Pas de tél</span>
                      )}
                    </div>
                  </td>

                  {/* 12 Colonnes Mois */}
                  {(lot.cotisation.months || []).map((amount, mIdx) => {
                    const isEditing = editingCell?.lotId === lot.id && editingCell?.monthIdx === mIdx;
                    const num = Number(amount) || 0;

                    let cellStyle = 'text-slate-500';
                    if (num >= tarifNormal) {
                      cellStyle = 'bg-emerald-500/10 text-emerald-300 font-semibold border-emerald-500/20';
                    } else if (num > 0) {
                      cellStyle = 'bg-amber-500/10 text-amber-300 font-semibold border-amber-500/20';
                    }

                    return (
                      <td 
                        key={mIdx}
                        onClick={() => !isEditing && startEdit(lot.id, mIdx, amount)}
                        className="py-1 px-0.5 text-center cursor-pointer select-none"
                        title="Cliquer pour modifier"
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            autoFocus
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={() => saveEdit(lot.id, mIdx)}
                            onKeyDown={(e) => handleKeyDown(e, lot.id, mIdx)}
                            className="w-11 h-7 bg-slate-800 border border-brand-500 text-center rounded text-white text-xs font-mono focus:outline-none"
                          />
                        ) : (
                          <div className={`py-1 rounded border border-transparent transition-all hover:border-slate-600 font-mono text-[11px] ${cellStyle}`}>
                            {num}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Total Payé */}
                  <td className="py-2 px-2 text-right font-mono font-semibold text-emerald-400 bg-emerald-950/5">
                    {lot.totalPaye.toLocaleString('fr-FR')}
                  </td>

                  {/* Reste Année */}
                  <td className="py-2 px-2 text-right font-mono font-medium text-amber-400 bg-amber-950/5">
                    {Math.max(0, lot.resteAnnuel).toLocaleString('fr-FR')}
                  </td>

                  {/* Arriérés */}
                  <td className="py-2 px-2 text-right font-mono font-medium text-red-400 bg-red-950/5">
                    {lot.arrieres.toLocaleString('fr-FR')}
                  </td>

                  {/* Total Dû */}
                  <td className="py-2 px-2.5 text-right font-mono font-bold text-white bg-slate-800/40">
                    {lot.totalDu === 0 ? (
                      <span className="text-emerald-400 flex items-center justify-end space-x-1">
                        <CheckCircle className="w-3 h-3 inline" />
                        <span>0</span>
                      </span>
                    ) : (
                      <span>{lot.totalDu.toLocaleString('fr-FR')}</span>
                    )}
                  </td>

                  {/* Actions Rapides */}
                  <td className="py-2 px-1 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Bouton PDF Appel de Fond */}
                      <button
                        onClick={() => {
                          setModalPayload(lot);
                          setActiveModal('appel_fond');
                        }}
                        className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        title="Générer l'Appel de Fond PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                      </button>

                      {/* Bouton WhatsApp */}
                      <button
                        onClick={() => {
                          setModalPayload(lot);
                          setActiveModal('whatsapp');
                        }}
                        className="p-1 text-slate-300 hover:text-white hover:bg-emerald-500/20 rounded transition-colors"
                        title="Envoyer message WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      </button>

                      {/* Bouton Paiement */}
                      <button
                        onClick={() => {
                          setModalPayload(lot);
                          setActiveModal('paiement');
                        }}
                        className="p-1 text-slate-300 hover:text-white hover:bg-blue-500/20 rounded transition-colors"
                        title="Enregistrer un paiement"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Ligne Totaux Globaux */}
          <tfoot>
            <tr className="bg-slate-800/90 font-mono font-bold text-slate-200 border-t-2 border-slate-700 text-[11px]">
              <td className="py-2.5 px-2.5 sticky left-0 bg-slate-800 z-10">TOTAL ({filteredLots.length})</td>
              <td className="py-2.5 px-3 sticky left-[75px] bg-slate-800 z-10 text-slate-400 font-normal">Cotisations / Mois</td>
              {monthlyTotals.map((tot, idx) => (
                <td key={idx} className="py-2.5 px-0.5 text-center text-slate-300 text-[10px]">
                  {tot}
                </td>
              ))}
              <td className="py-2.5 px-2 text-right text-emerald-400 font-bold bg-emerald-950/20">
                {totalPayeSum.toLocaleString('fr-FR')}
              </td>
              <td className="py-2.5 px-2 text-right text-amber-400 font-bold bg-amber-950/20">
                {totalResteSum.toLocaleString('fr-FR')}
              </td>
              <td className="py-2.5 px-2 text-right text-red-400 font-bold bg-red-950/20">
                {totalArrieresSum.toLocaleString('fr-FR')}
              </td>
              <td className="py-2.5 px-2.5 text-right text-white font-extrabold text-xs bg-slate-800">
                {totalDuSum.toLocaleString('fr-FR')}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
