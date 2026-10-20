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
  KeyRound,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { generateAppelDeFondPDF } from '../lib/pdfGenerator';
import { MESSAGE_TEMPLATES } from '../lib/whatsapp';

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
    switchToClient,
    residence
  } = useSyndic();

  // Édition inline de cellule
  const [editingCell, setEditingCell] = useState(null); // { lotId, monthIdx }
  const [tempValue, setTempValue] = useState('');
  const [copiedLotCode, setCopiedLotCode] = useState(null);

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

  // Copier le lien magique d'accès client
  const handleCopyClientAccess = (lot) => {
    const pin = lot.coproprietaire.pin || (lot.coproprietaire.tel ? lot.coproprietaire.tel.replace(/[^\d]/g, '').slice(-4) : '1234');
    const link = `${window.location.origin}/?client=${encodeURIComponent(lot.code)}`;
    const text = `Espace Copropriétaire (${lot.code}) : ${link} | Code PIN : ${pin}`;
    navigator.clipboard.writeText(text);
    setCopiedLotCode(lot.code);
    setTimeout(() => setCopiedLotCode(null), 2000);
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
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
      {/* Barre de contrôle & Filtres */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par copropriétaire, lot (M02, A10) ou tél..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-sm"
          />
        </div>

        {/* Filtres par statut & type */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Statut */}
          <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
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
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterStatus === tab.id
                    ? 'bg-white dark:bg-brand-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Lot */}
          <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterType('appartement')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1 ${
                filterType === 'appartement' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building className="w-3 h-3" />
              <span>Appts</span>
            </button>
            <button
              onClick={() => setFilterType('magasin')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center space-x-1 ${
                filterType === 'magasin' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Store className="w-3 h-3" />
              <span>Magasins</span>
            </button>
          </div>

          {/* Bouton Annuaire Mots de Passe & Identifiants */}
          <button
            onClick={() => setActiveModal('credentials')}
            className="flex items-center space-x-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Consulter tous les noms d'utilisateurs et mots de passe (Codes PIN) des copropriétaires"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Mots de Passe Copropriétaires</span>
          </button>
        </div>
      </div>

      {/* Grille Matricielle Pleine Largeur (Full-Width Responsive Table) */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {/* Lot */}
              <th className="py-2.5 px-2.5 sticky left-0 z-20 bg-slate-100 dark:bg-slate-800/95 backdrop-blur-sm min-w-[75px] w-[6%] border-r border-slate-200/80 dark:border-slate-700/80">
                Lot / Ét.
              </th>
              {/* Copropriétaire */}
              <th className="py-2.5 px-3 sticky left-[75px] z-20 bg-slate-100 dark:bg-slate-800/95 backdrop-blur-sm min-w-[170px] w-[18%] border-r border-slate-200/80 dark:border-slate-700/80">
                Copropriétaire
              </th>
              {/* 12 Mois */}
              {MOIS_NOMS.map((m) => (
                <th key={m} className="py-2.5 px-1 text-center min-w-[42px] font-mono text-[10px] text-slate-500 dark:text-slate-400 border-r border-slate-200/50 dark:border-slate-800">
                  {m}
                </th>
              ))}
              {/* Payé */}
              <th className="py-2.5 px-2 text-right font-bold text-emerald-700 dark:text-emerald-400 min-w-[65px] w-[6%] bg-emerald-50/50 dark:bg-emerald-950/10">
                Payé
              </th>
              {/* Reste */}
              <th className="py-2.5 px-2 text-right font-bold text-amber-700 dark:text-amber-400 min-w-[65px] w-[6%] bg-amber-50/50 dark:bg-amber-950/10">
                Reste {selectedYear}
              </th>
              {/* Arriérés */}
              <th className="py-2.5 px-2 text-right font-bold text-red-700 dark:text-red-400 min-w-[65px] w-[6%] bg-red-50/50 dark:bg-red-950/10">
                Arriérés
              </th>
              {/* Total Dû */}
              <th className="py-2.5 px-2.5 text-right font-extrabold text-slate-900 dark:text-white min-w-[75px] w-[7%] bg-slate-200/60 dark:bg-slate-800/60">
                Total Dû
              </th>
              {/* Actions Rapides */}
              <th className="py-2.5 px-2 text-center min-w-[110px] w-[8%]">
                Actions Rapides
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
            {filteredLots.map((lot, rIdx) => {
              const isEven = rIdx % 2 === 0;
              const isMag = lot.type === 'magasin';
              const tarifNormal = isMag ? 150 : 300;

              return (
                <tr 
                  key={lot.id} 
                  className={`hover:bg-brand-50/40 dark:hover:bg-slate-800/40 transition-colors ${
                    isEven ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-slate-900/40'
                  }`}
                >
                  {/* Code Lot & Étage */}
                  <td className="py-2 px-2.5 sticky left-0 z-10 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        lot.totalDu === 0 
                          ? 'bg-emerald-500' 
                          : lot.totalPaye > 0 
                            ? 'bg-amber-500' 
                            : 'bg-red-500'
                      }`} />
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{lot.code}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                        {lot.etage}
                      </span>
                    </div>
                  </td>

                  {/* Nom du Copropriétaire & Tél */}
                  <td className="py-2 px-3 sticky left-[75px] z-10 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-tight" title={lot.coproprietaire.nom}>
                      {lot.coproprietaire.nom}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {lot.coproprietaire.tel ? (
                        <span className="flex items-center space-x-1 font-mono text-slate-600 dark:text-slate-400">
                          <Phone className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{lot.coproprietaire.tel.split('/')[0]}</span>
                        </span>
                      ) : (
                        <span className="italic text-slate-400">Pas de tél</span>
                      )}
                    </div>
                  </td>

                  {/* 12 Colonnes Mois */}
                  {(lot.cotisation.months || []).map((amount, mIdx) => {
                    const isEditing = editingCell?.lotId === lot.id && editingCell?.monthIdx === mIdx;
                    const num = Number(amount) || 0;

                    let cellStyle = 'text-slate-400 dark:text-slate-500';
                    if (num >= tarifNormal) {
                      cellStyle = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/20';
                    } else if (num > 0) {
                      cellStyle = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-500/20';
                    }

                    return (
                      <td 
                        key={mIdx}
                        onClick={() => !isEditing && startEdit(lot.id, mIdx, amount)}
                        className="py-1 px-0.5 text-center cursor-pointer select-none border-r border-slate-200/40 dark:border-slate-800/40"
                        title="Cliquer pour modifier le montant"
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            autoFocus
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={() => saveEdit(lot.id, mIdx)}
                            onKeyDown={(e) => handleKeyDown(e, lot.id, mIdx)}
                            className="w-11 h-7 bg-white dark:bg-slate-800 border-2 border-brand-500 text-center rounded text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none shadow-sm"
                          />
                        ) : (
                          <div className={`py-1 rounded transition-all hover:bg-slate-200/60 dark:hover:border-slate-600 font-mono text-[11px] ${cellStyle}`}>
                            {num}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Total Payé */}
                  <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/5">
                    {lot.totalPaye.toLocaleString('fr-FR')}
                  </td>

                  {/* Reste Année */}
                  <td className="py-2 px-2 text-right font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/5">
                    {Math.max(0, lot.resteAnnuel).toLocaleString('fr-FR')}
                  </td>

                  {/* Arriérés */}
                  <td className="py-2 px-2 text-right font-mono font-semibold text-red-700 dark:text-red-400 bg-red-50/30 dark:bg-red-950/5">
                    {lot.arrieres.toLocaleString('fr-FR')}
                  </td>

                  {/* Total Dû */}
                  <td className="py-2 px-2.5 text-right font-mono font-extrabold text-slate-900 dark:text-white bg-slate-100/60 dark:bg-slate-800/40">
                    {lot.totalDu === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end space-x-1">
                        <CheckCircle className="w-3.5 h-3.5 inline" />
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
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Générer l'Appel de Fond PDF officiel"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                      </button>

                      {/* Bouton Relance WhatsApp */}
                      <button
                        onClick={() => {
                          setModalPayload(lot);
                          setActiveModal('whatsapp');
                        }}
                        className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                        title="Ouvrir le Hub WhatsApp (wa.me)"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      </button>

                      {/* Bouton Copier / Envoyer Accès Espace Client */}
                      <button
                        onClick={() => handleCopyClientAccess(lot)}
                        className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-brand-500/20 rounded-lg transition-colors"
                        title="Copier le lien d'accès et PIN pour ce client"
                      >
                        {copiedLotCode === lot.code ? (
                          <Check className="w-3.5 h-3.5 text-brand-600" />
                        ) : (
                          <KeyRound className="w-3.5 h-3.5 text-brand-600" />
                        )}
                      </button>

                      {/* Bouton Encaisser Paiement */}
                      <button
                        onClick={() => {
                          setModalPayload(lot);
                          setActiveModal('paiement');
                        }}
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-300 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Enregistrer un encaissement"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Ligne Totaux Globaux */}
          <tfoot>
            <tr className="bg-slate-100 dark:bg-slate-800/90 font-mono font-bold text-slate-900 dark:text-slate-200 border-t-2 border-slate-300 dark:border-slate-700 text-[11px]">
              <td className="py-2.5 px-2.5 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10 border-r border-slate-300">TOTAL ({filteredLots.length})</td>
              <td className="py-2.5 px-3 sticky left-[75px] bg-slate-100 dark:bg-slate-800 z-10 text-slate-600 dark:text-slate-400 font-normal border-r border-slate-300">Cotisations / Mois</td>
              {monthlyTotals.map((tot, idx) => (
                <td key={idx} className="py-2.5 px-0.5 text-center text-slate-800 dark:text-slate-300 text-[10px] border-r border-slate-200/50">
                  {tot}
                </td>
              ))}
              <td className="py-2.5 px-2 text-right text-emerald-700 dark:text-emerald-400 font-extrabold bg-emerald-100/60 dark:bg-emerald-950/20">
                {totalPayeSum.toLocaleString('fr-FR')}
              </td>
              <td className="py-2.5 px-2 text-right text-amber-700 dark:text-amber-400 font-extrabold bg-amber-100/60 dark:bg-amber-950/20">
                {totalResteSum.toLocaleString('fr-FR')}
              </td>
              <td className="py-2.5 px-2 text-right text-red-700 dark:text-red-400 font-extrabold bg-red-100/60 dark:bg-red-950/20">
                {totalArrieresSum.toLocaleString('fr-FR')}
              </td>
              <td className="py-2.5 px-2.5 text-right text-slate-900 dark:text-white font-extrabold text-xs bg-slate-200 dark:bg-slate-800">
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
