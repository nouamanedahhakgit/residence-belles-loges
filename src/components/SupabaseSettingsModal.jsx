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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isSupabaseOnline 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Configuration Supabase</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  isSupabaseOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {isSupabaseOnline ? 'En ligne' : 'Mode Local / Démo'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connectez votre base PostgreSQL en nuage Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Guide rapide */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 text-slate-300 space-y-1.5">
            <p className="font-semibold text-white flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-brand-400" />
              <span>Comment connecter Supabase :</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] pl-1">
              <li>Créez un projet gratuit sur <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-brand-400 underline">supabase.com</a></li>
              <li>Dans <strong>SQL Editor</strong>, exécutez <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">supabase/schema.sql</code></li>
              <li>Puis exécutez <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">supabase/seed.sql</code> pour injecter les données de l'Excel</li>
              <li>Récupérez vos clés dans <strong>Settings &gt; API</strong> et collez-les ci-dessous :</li>
            </ol>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center space-x-1">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span>Project URL (VITE_SUPABASE_URL) :</span>
              </label>
              <input
                type="text"
                placeholder="https://xyzabcdefg.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>API Key anon public (VITE_SUPABASE_ANON_KEY) :</span>
              </label>
              <textarea
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-500 leading-tight"
              />
            </div>
          </div>

          {/* Test status feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !url || !key}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl font-medium transition-colors"
            >
              {testing ? 'Test en cours...' : 'Tester la connexion'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold shadow-lg shadow-brand-600/30 transition-all active:scale-95"
            >
              Enregistrer & Recharger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
