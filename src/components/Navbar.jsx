import React, { useRef } from 'react';
import { useSyndic } from '../context/SyndicContext';
import { 
  Building2, 
  Calendar, 
  FileSpreadsheet, 
  MessageSquare, 
  CreditCard, 
  Database, 
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download
} from 'lucide-react';

export default function Navbar() {
  const { 
    residence, 
    selectedYear, 
    setSelectedYear, 
    isSupabaseOnline,
    exportToExcel,
    importFromExcel,
    resetToExcelDefaults,
    setActiveModal,
    setModalPayload
  } = useSyndic();

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      importFromExcel(file);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Titre */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {residence.nom}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Casablanca
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xs">
                {residence.adresse}
              </p>
            </div>
          </div>

          {/* Année & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sélecteur d'année */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 ml-1.5 mr-1" />
              {[2026, 2025, 2024].map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedYear === year
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Supabase Status Pill */}
            <button
              onClick={() => setActiveModal('supabase_settings')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isSupabaseOnline
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="Configurer Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isSupabaseOnline ? 'Supabase Connecté' : 'Mode Local / Démo'}
              </span>
              {isSupabaseOnline ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Hub WhatsApp */}
            <button
              onClick={() => {
                setModalPayload(null);
                setActiveModal('whatsapp');
              }}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hub WhatsApp</span>
            </button>

            {/* Nouveau Paiement */}
            <button
              onClick={() => {
                setModalPayload(null);
                setActiveModal('paiement');
              }}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Encaisser</span>
            </button>

            {/* Hidden File Input for Excel Import */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".xlsx, .xls" 
              onChange={handleFileChange} 
              className="hidden" 
            />

            {/* Importer depuis Excel */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 text-xs font-medium transition-colors"
              title="Importer un fichier Excel (.xlsx) et mettre à jour l'écran et Supabase"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Importer Excel</span>
            </button>

            {/* Exporter Excel Multi-Feuilles */}
            <button
              onClick={exportToExcel}
              className="flex items-center space-x-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
              title="Télécharger le fichier Excel complet à jour (.xlsx) identique au modèle officiel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Exporter Excel (.xlsx)</span>
            </button>

            {/* Réinitialiser aux valeurs d'origine */}
            <button
              onClick={resetToExcelDefaults}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-slate-700/40 transition-colors"
              title="Réinitialiser l'état initial Excel"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
