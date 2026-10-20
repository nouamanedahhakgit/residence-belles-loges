import React from 'react';
import { useSyndic } from '../context/SyndicContext';
import { 
  TrendingUp, 
  AlertCircle, 
  History, 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle 
} from 'lucide-react';

export default function StatsCards() {
  const { stats, selectedYear, setFilterStatus } = useSyndic();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Encaissé */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm group hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">Total Encaissé ({selectedYear})</p>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-extrabold text-white tracking-tight">
            {stats.totalRecouvre.toLocaleString('fr-FR')}
          </span>
          <span className="text-xs font-semibold text-emerald-400">DH</span>
        </div>
        
        {/* Taux de recouvrement */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Taux de recouvrement</span>
            <span className="font-semibold text-emerald-400">{stats.tauxRecouvrement}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.tauxRecouvrement)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Reste à Payer (Exercice en cours) */}
      <div 
        onClick={() => setFilterStatus('retard')}
        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm cursor-pointer group hover:border-amber-500/30 transition-all"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">Reste à Recouvrer ({selectedYear})</p>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-extrabold text-amber-400 tracking-tight">
            {stats.totalReste.toLocaleString('fr-FR')}
          </span>
          <span className="text-xs font-semibold text-amber-500">DH</span>
        </div>
        <p className="mt-3 text-xs text-slate-400 flex items-center">
          Sur un budget exigible de <span className="font-medium text-slate-300 ml-1">{stats.totalExige.toLocaleString('fr-FR')} DH</span>
        </p>
      </div>

      {/* 3. Arriérés Antérieurs */}
      <div 
        onClick={() => setFilterStatus('arrieres')}
        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm cursor-pointer group hover:border-red-500/30 transition-all"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-400">Arriérés Exercices Antérieurs</p>
          <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-extrabold text-red-400 tracking-tight">
            {stats.totalArrieres.toLocaleString('fr-FR')}
          </span>
          <span className="text-xs font-semibold text-red-500">DH</span>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Total créances cumulées : <span className="font-semibold text-white ml-1">{stats.totalDuGlobal.toLocaleString('fr-FR')} DH</span>
        </p>
      </div>

      {/* 4. Statut des Copropriétaires */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-slate-400">Situation des 33 Lots</p>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 pt-1 border-t border-slate-800/80">
          <button 
            onClick={() => setFilterStatus('a_jour')}
            className="text-left group"
          >
            <div className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>{stats.countAJour}</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-slate-200">À jour</span>
          </button>

          <button 
            onClick={() => setFilterStatus('retard')}
            className="text-left group"
          >
            <div className="flex items-center space-x-1 text-amber-400 text-xs font-semibold">
              <Clock className="w-3 h-3" />
              <span>{stats.countEnRetard}</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-slate-200">Partiel</span>
          </button>

          <button 
            onClick={() => setFilterStatus('impaye')}
            className="text-left group"
          >
            <div className="flex items-center space-x-1 text-red-400 text-xs font-semibold">
              <XCircle className="w-3 h-3" />
              <span>{stats.countImpaye}</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-slate-200">Impayé</span>
          </button>
        </div>
      </div>
    </div>
  );
}
