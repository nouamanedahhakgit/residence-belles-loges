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
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Encaissé ({selectedYear})</p>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            {stats.totalRecouvre.toLocaleString('fr-FR')}
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">DH</span>
        </div>
        
        {/* Taux de recouvrement */}
        <div className="mt-3.5">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-500 dark:text-slate-400">Taux de recouvrement</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.tauxRecouvrement}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden cursor-pointer group hover:border-amber-500/40 transition-all"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reste à Recouvrer ({selectedYear})</p>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            {stats.totalReste.toLocaleString('fr-FR')}
          </span>
          <span className="text-xs font-bold text-amber-600">DH</span>
        </div>
        <p className="mt-3.5 text-xs text-slate-500 dark:text-slate-400 flex items-center">
          Sur budget annuel de <span className="font-semibold text-slate-700 dark:text-slate-200 ml-1">{stats.totalExige.toLocaleString('fr-FR')} DH</span>
        </p>
      </div>

      {/* 3. Arriérés Antérieurs */}
      <div 
        onClick={() => setFilterStatus('arrieres')}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden cursor-pointer group hover:border-red-500/40 transition-all"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Arriérés Exercices Antérieurs</p>
          <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 font-mono tracking-tight">
            {stats.totalArrieres.toLocaleString('fr-FR')}
          </span>
          <span className="text-xs font-bold text-red-600">DH</span>
        </div>
        <p className="mt-3.5 text-xs text-slate-500 dark:text-slate-400">
          Créances cumulées : <span className="font-bold text-slate-900 dark:text-white ml-1">{stats.totalDuGlobal.toLocaleString('fr-FR')} DH</span>
        </p>
      </div>

      {/* 4. Statut des Copropriétaires */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Situation des 33 Lots</p>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setFilterStatus('a_jour')}
            className="text-left p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center space-x-1 text-[11px] font-medium text-emerald-600">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>À jour</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.countAJour}</p>
          </button>

          <button 
            onClick={() => setFilterStatus('retard')}
            className="text-left p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center space-x-1 text-[11px] font-medium text-amber-600">
              <Clock className="w-3 h-3 shrink-0" />
              <span>Partiel</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.countEnRetard}</p>
          </button>

          <button 
            onClick={() => setFilterStatus('impaye')}
            className="text-left p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center space-x-1 text-[11px] font-medium text-red-600">
              <XCircle className="w-3 h-3 shrink-0" />
              <span>Impayé</span>
            </div>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.countImpaye}</p>
          </button>
        </div>
      </div>
    </div>
  );
}
