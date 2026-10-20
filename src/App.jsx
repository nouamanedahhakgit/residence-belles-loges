import React from 'react';
import { SyndicProvider, useSyndic } from './context/SyndicContext';
import Navbar from './components/Navbar';
import StatsCards from './components/StatsCards';
import CotisationsMatrix from './components/CotisationsMatrix';
import WhatsAppHubModal from './components/WhatsAppHubModal';
import AppelDeFondModal from './components/AppelDeFondModal';
import PaymentModal from './components/PaymentModal';
import SupabaseSettingsModal from './components/SupabaseSettingsModal';
import { 
  Building2, 
  ShieldCheck, 
  FileText, 
  MessageSquare, 
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';

function DashboardContent() {
  const { residence, selectedYear, setActiveModal, isSupabaseOnline } = useSyndic();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* En-tête / Bannière de la Résidence */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-brand-950/40 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  Exercice {selectedYear}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-slate-400 text-xs">33 Lots (4 Magasins & 29 Appartements)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                Tableau de Bord des Cotisations Syndicales
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Suivi matriciel en temps réel, génération des appels de fonds au format PDF officiel et relances personnalisées par WhatsApp (wa.me).
              </p>
            </div>

            {/* Raccourcis majeurs */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setActiveModal('whatsapp')}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Relances WhatsApp</span>
              </button>

              <button
                onClick={() => setActiveModal('appel_fond')}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Générer Appel PDF</span>
              </button>
            </div>
          </div>

          {/* Bandeau Coordonnées Bancaires Officiel */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Banque :</span>
              <span className="text-slate-200 font-semibold">{residence.banque}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500 font-medium">Titulaire :</span>
              <span className="text-slate-200 font-semibold">{residence.nom}</span>
            </div>
            <div className="flex items-center space-x-1.5 font-mono bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/80">
              <span className="text-slate-400 text-[11px]">RIB :</span>
              <span className="text-emerald-400 font-bold text-[11px] select-all">{residence.rib}</span>
            </div>
          </div>
        </div>

        {/* Cartes KPI Statistiques */}
        <StatsCards />

        {/* Grille Matricielle Principale (Remplacement de l'Excel) */}
        <CotisationsMatrix />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-medium text-slate-400">
            {residence.nom} • {residence.adresse}
          </p>
          <p className="text-[11px] text-slate-600">
            Conforme à la Loi n° 18-00 relative au statut de la copropriété des immeubles bâtis au Maroc. Déployable sur Netlify avec base de données Supabase.
          </p>
        </div>
      </footer>

      {/* Modales Interactives */}
      <WhatsAppHubModal />
      <AppelDeFondModal />
      <PaymentModal />
      <SupabaseSettingsModal />
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
