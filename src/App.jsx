import React from 'react';
import { SyndicProvider, useSyndic } from './context/SyndicContext';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import CotisationsMatrix from './components/CotisationsMatrix';
import MultiResidenceDashboard from './components/MultiResidenceDashboard';
import ClientPortal from './components/ClientPortal';
import WhatsAppHubModal from './components/WhatsAppHubModal';
import AppelDeFondModal from './components/AppelDeFondModal';
import PaymentModal from './components/PaymentModal';
import SupabaseSettingsModal from './components/SupabaseSettingsModal';
import NewResidenceModal from './components/NewResidenceModal';
import CoproprietairesCredentialsModal from './components/CoproprietairesCredentialsModal';
import { 
  Building2, 
  ShieldCheck, 
  FileText, 
  MessageSquare, 
  ArrowUpRight,
  Sparkles,
  Info,
  Copy,
  Check,
  UserCheck,
  ChevronLeft
} from 'lucide-react';

function DashboardContent() {
  const { 
    residence, 
    selectedYear, 
    setActiveModal, 
    isSupabaseOnline,
    currentResidenceId,
    isClientView,
    switchToAdmin,
    clientSession
  } = useSyndic();

  const [copiedRib, setCopiedRib] = React.useState(false);

  const handleCopyRib = () => {
    navigator.clipboard.writeText(residence.rib);
    setCopiedRib(true);
    setTimeout(() => setCopiedRib(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      {/* Bandeau d'information quand le mode Espace Copropriétaire est actif */}
      {isClientView && (
        <div className="bg-brand-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4" />
            <span className="font-semibold">
              Mode Espace Copropriétaire actif {clientSession ? `(${clientSession.nom} - Lot ${clientSession.lotCode})` : '(Vue de connexion)'}
            </span>
          </div>
          <button
            onClick={switchToAdmin}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-bold transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>← Revenir à l'Administration Syndic</span>
          </button>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        {/* Condition 1 : Vue Espace Copropriétaire */}
        {isClientView ? (
          <ClientPortal />
        ) : currentResidenceId === 'all' ? (
          /* Condition 2 : Vue Globale Multi-Résidences */
          <MultiResidenceDashboard />
        ) : (
          /* Condition 3 : Vue Standard Immeuble Sélectionné (Belles Loges, etc.) */
          <>
            {/* Bannière de l'immeuble (Clair, moderne, sans fond noir) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20">
                      Exercice {selectedYear}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {residence.totalLots || 33} Lots ({residence.magasinsCount || 4} Magasins & {residence.apptsCount || 29} Appartements)
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1.5">
                    {residence.nom}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                    Matrice de cotisations en temps réel, génération d'appels de fonds PDF officiels et relances directes WhatsApp (wa.me).
                  </p>
                </div>

                {/* Raccourcis majeurs */}
                <div className="flex items-center space-x-2.5 shrink-0">
                  <button
                    onClick={() => setActiveModal('whatsapp')}
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Relances WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setActiveModal('appel_fond')}
                    className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Appel de Fond PDF</span>
                  </button>
                </div>
              </div>

              {/* Bandeau Coordonnées Bancaires Officiel */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-500">Banque :</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{residence.banque}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="font-semibold text-slate-500">Bénéficiaire :</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{residence.nom}</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 text-[11px] font-bold">RIB :</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-extrabold text-[11px] select-all tracking-wider">
                    {residence.rib}
                  </span>
                  <button 
                    onClick={handleCopyRib}
                    className="ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    title="Copier le RIB"
                  >
                    {copiedRib ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Cartes KPI Statistiques */}
            <StatsCards />

            {/* Grille Matricielle Pleine Largeur */}
            <CotisationsMatrix />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500 dark:text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-700 dark:text-slate-400">
            {residence.nom} • {residence.adresse || residence.ville}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-600">
            Plateforme conforme à la Loi n° 18-00 sur la copropriété au Maroc • Synchronisation Supabase & Export Excel multi-feuilles
          </p>
        </div>
      </footer>

      {/* Modales Interactives */}
      <WhatsAppHubModal />
      <AppelDeFondModal />
      <PaymentModal />
      <SupabaseSettingsModal />
      <NewResidenceModal />
      <CoproprietairesCredentialsModal />
    </div>
  );
}

export default function App() {
  return (
    <SyndicProvider>
      <DashboardContent />
    </SyndicProvider>
  );
}
