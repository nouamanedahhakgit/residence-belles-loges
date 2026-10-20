import React, { useState } from 'react';
import { useSyndic } from '../context/SyndicContext';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Key, 
  Server,
  HelpCircle
} from 'lucide-react';
import { 
  SUPABASE_URL, 
  SUPABASE_ANON_KEY, 
  saveSupabaseConfig, 
  testSupabaseConnection 
} from '../lib/supabaseClient';

export default function SupabaseSettingsModal() {
  const { activeModal, setActiveModal, isSupabaseOnline } = useSyndic();

  if (activeModal !== 'supabase_settings') return null;

  const [url, setUrl] = useState(SUPABASE_URL || '');
  const [key, setKey] = useState(SUPABASE_ANON_KEY || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url, key);
    setTestResult(res);
    setTesting(false);
  };

  const handleSave = () => {
    saveSupabaseConfig(url, key);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isSupabaseOnline 
                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' 
                : 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Configuration Supabase</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isSupabaseOnline
                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-300'
                }`}>
                  {isSupabaseOnline ? 'En ligne' : 'Mode Local / Démo'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connectez votre base PostgreSQL en nuage Supabase pour la synchronisation temps réel.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Guide rapide */}
          <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 text-slate-700 dark:text-slate-300 space-y-1.5">
            <p className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-brand-600" />
              <span>Comment connecter Supabase :</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] pl-1">
              <li>Créez un projet gratuit sur <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-brand-600 underline font-semibold">supabase.com</a></li>
              <li>Dans <strong>SQL Editor</strong>, exécutez <code className="text-slate-800 bg-slate-200 dark:bg-slate-900 dark:text-slate-200 px-1 py-0.5 rounded font-mono">supabase/schema.sql</code></li>
              <li>Puis exécutez <code className="text-slate-800 bg-slate-200 dark:bg-slate-900 dark:text-slate-200 px-1 py-0.5 rounded font-mono">supabase/seed.sql</code> pour injecter les données de l'Excel</li>
              <li>Récupérez vos clés dans <strong>Settings &gt; API</strong> et collez-les ci-dessous :</li>
            </ol>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1 flex items-center space-x-1">
                <Server className="w-3.5 h-3.5 text-blue-600" />
                <span>Project URL (VITE_SUPABASE_URL) :</span>
              </label>
              <input
                type="text"
                placeholder="https://xyzabcdefg.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>API Key anon public (VITE_SUPABASE_ANON_KEY) :</span>
              </label>
              <textarea
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500 leading-tight"
              />
            </div>
          </div>

          {/* Test status feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-semibold">{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !url || !key}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold transition-colors"
            >
              {testing ? 'Test en cours...' : 'Tester la connexion'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-600/20 transition-all active:scale-95"
            >
              Enregistrer & Recharger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
