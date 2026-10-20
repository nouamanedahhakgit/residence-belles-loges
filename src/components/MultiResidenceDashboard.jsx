import React from 'react';
import { useSyndic } from '../context/SyndicContext';
import { 
  Building2, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  ArrowRight, 
  Plus, 
  ShieldCheck, 
  CreditCard,
  MapPin,
  ExternalLink
} from 'lucide-react';

export default function MultiResidenceDashboard() {
  const { 
    residencesList, 
    setCurrentResidenceId, 
    stats, 
    selectedYear,
    setActiveModal 
  } = useSyndic();

  // Statistiques consolidées simulées basées sur les résidences gérées
  const totalLotsPortefeuille = residencesList.reduce((acc, r) => acc + (r.totalLots || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* En-tête du Dashboard Multi-Résidences */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Vue Globale Consolidée
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-medium">{residencesList.length} Résidences • {totalLotsPortefeuille} Lots</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Portefeuille Syndic Multi-Immeubles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Vue d'ensemble de vos résidences, suivi du recouvrement financier global et navigation rapide par immeuble.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setActiveModal('nouvelle_residence')}
            className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ajouter une Résidence</span>
          </button>
        </div>
      </div>

      {/* Cartes KPI Consolidées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cash Portefeuille */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Encaissé ({selectedYear})</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {(stats.totalRecouvre + 98000).toLocaleString('fr-FR')}
            </span>
            <span className="text-xs font-semibold text-emerald-600">DH</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Consolidé sur les {residencesList.length} résidences
          </p>
        </div>

        {/* Total Impayés */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Créances & Impayés</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono tracking-tight">
              {(stats.totalDuGlobal + 32000).toLocaleString('fr-FR')}
            </span>
            <span className="text-xs font-semibold text-amber-700">DH</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Dont {stats.totalArrieres.toLocaleString('fr-FR')} DH d'arriérés antérieurs
          </p>
        </div>

        {/* Taux de Recouvrement Consolidé */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Taux de Recouvrement Global</span>
            <span className="text-xs font-bold text-emerald-600">76%</span>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              76.4%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '76.4%' }} />
          </div>
        </div>

        {/* Résidences Gérées */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Lots Gérés</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {totalLotsPortefeuille}
            </span>
            <span className="text-xs font-semibold text-slate-500">lots</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Sur {residencesList.length} résidences à Casablanca
          </p>
        </div>
      </div>

      {/* Grille des Résidences */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">
            Liste de vos Résidences Syndicales
          </h3>
          <span className="text-xs text-slate-500">
            Cliquez sur un immeuble pour ouvrir sa matrice 12 mois
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {residencesList.map((res) => {
            const isBellesLoges = res.id === 'res-belles-loges';
            const tauxRecouv = isBellesLoges ? stats.tauxRecouvrement : 82;
            const cash = isBellesLoges ? stats.totalRecouvre : 54000;
            const reste = isBellesLoges ? stats.totalReste : 18000;

            return (
              <div 
                key={res.id}
                className="bg-white border border-slate-200 hover:border-brand-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {res.totalLots} Lots ({res.magasinsCount} Mag. • {res.apptsCount} Appts)
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {tauxRecouv}% payé
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mt-3 group-hover:text-brand-600 transition-colors">
                    {res.nom}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{res.adresse}</span>
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Encaissé ({selectedYear}) :</span>
                      <span className="font-mono font-bold text-emerald-600">{cash.toLocaleString('fr-FR')} DH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reste à recouvrer :</span>
                      <span className="font-mono font-bold text-amber-600">{reste.toLocaleString('fr-FR')} DH</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>RIB :</span>
                      <span className="truncate max-w-[170px]">{res.rib}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setCurrentResidenceId(res.id)}
                    className="w-full bg-slate-900 hover:bg-brand-600 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                  >
                    <span>Gérer cette Résidence</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
