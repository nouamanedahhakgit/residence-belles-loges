import React, { useRef, useState } from 'react';
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
  Download,
  ChevronDown,
  Globe,
  Plus,
  UserCheck,
  Sun,
  Moon,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function Navbar() {
  const { 
    residence, 
    residencesList,
    currentResidenceId,
    setCurrentResidenceId,
    selectedYear, 
    setSelectedYear, 
    isSupabaseOnline,
    exportToExcel,
    importFromExcel,
    resetToExcelDefaults,
    setActiveModal,
    setModalPayload,
    theme,
    toggleTheme,
    isClientView,
    setIsClientView,
    clientSession
  } = useSyndic();

  const fileInputRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      importFromExcel(file);
      e.target.value = '';
    }
  };

  const currentResidenceObj = residencesList.find(r => r.id === currentResidenceId);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Sélecteur Multi-Résidences */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center shadow-md shadow-brand-500/20 text-white shrink-0">
              <Building2 className="w-5 h-5" />
            </div>

            {/* Dropdown Menu Sélecteur de Résidence */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-brand-600 transition-colors">
                      {currentResidenceId === 'all' 
                        ? '🌐 TOUTES LES RÉSIDENCES' 
                        : (currentResidenceObj?.nom || residence.nom)}
                    </h1>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-xs">
                    {currentResidenceId === 'all' 
                      ? 'Vue globale consolidée multi-immeubles' 
                      : (currentResidenceObj?.adresse || residence.adresse)}
                  </p>
                </div>
              </button>

              {/* Menu Déroulant des Résidences */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 z-20 animate-fade-in font-sans">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Portefeuille Immobilier
                    </div>

                    {/* Option 1: Vue Consolidée */}
                    <button
                      onClick={() => {
                        setCurrentResidenceId('all');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                        currentResidenceId === 'all' ? 'text-brand-600 bg-brand-50/50 dark:bg-brand-950/20' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-brand-600" />
                        <div>
                          <p className="font-bold">Toutes les Résidences (Vue Globale)</p>
                          <p className="text-[10px] text-slate-400">Dashboard consolidé & KPIs</p>
                        </div>
                      </div>
                      {currentResidenceId === 'all' && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
                    </button>

                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Vos Immeubles
                    </div>

                    {/* Liste des résidences */}
                    {residencesList.map((r) => {
                      const isSelected = currentResidenceId === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            setCurrentResidenceId(r.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                            isSelected ? 'text-brand-600 bg-brand-50/50 dark:bg-brand-950/20 font-bold' : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                            <div className="truncate">
                              <p className="font-semibold truncate">{r.nom}</p>
                              <p className="text-[10px] text-slate-400 truncate">{r.adresse || r.ville}</p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />}
                        </button>
                      );
                    })}

                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                    {/* Ajouter une résidence */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setActiveModal('nouvelle_residence');
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Ajouter un nouvel immeuble</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions & Outils */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Basculer Espace Copropriétaire (Mode Client / Admin) */}
            <button
              onClick={() => setIsClientView(!isClientView)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isClientView
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-brand-50 hover:text-brand-600'
              }`}
              title="Aperçu ou accès à l'Espace Copropriétaire privé"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {isClientView ? 'Mode Admin' : 'Espace Copropriétaire'}
              </span>
            </button>

            {/* Sélecteur d'année */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1 hidden sm:block" />
              {[2026, 2025, 2024].map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedYear === year
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Supabase Status Pill */}
            <button
              onClick={() => setActiveModal('supabase_settings')}
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                isSupabaseOnline
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300'
              }`}
              title="Statut de synchronisation Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">
                {isSupabaseOnline ? 'Supabase Connecté' : 'Mode Local'}
              </span>
              {isSupabaseOnline ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              )}
            </button>

            {/* Hub WhatsApp */}
            <button
              onClick={() => {
                setModalPayload(null);
                setActiveModal('whatsapp');
              }}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
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
              className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
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
              className="hidden xl:flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors"
              title="Importer un fichier Excel (.xlsx) et synchroniser avec Supabase"
            >
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>Import Excel</span>
            </button>

            {/* Exporter Excel Multi-Feuilles */}
            <button
              onClick={exportToExcel}
              className="hidden lg:flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              title="Télécharger le fichier Excel officiel complet (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden 2xl:inline">Export Excel</span>
            </button>

            {/* Thème Clair / Sombre */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
