import { createClient } from '@supabase/supabase-js';

// Récupération depuis l'environnement ou le localStorage
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('BELLES_LOGES_SUPABASE_URL') || '' : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('BELLES_LOGES_SUPABASE_KEY') || '' : '';

export const SUPABASE_URL = storedUrl || envUrl;
export const SUPABASE_ANON_KEY = storedKey || envKey;

export const isSupabaseConfigured = () => {
  return Boolean(
    SUPABASE_URL && 
    SUPABASE_URL.startsWith('https://') && 
    SUPABASE_ANON_KEY && 
    SUPABASE_ANON_KEY.length > 20
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Sauvegarde les identifiants Supabase dans le localStorage
 */
export function saveSupabaseConfig(url, key) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('BELLES_LOGES_SUPABASE_URL', url.trim());
    localStorage.setItem('BELLES_LOGES_SUPABASE_KEY', key.trim());
    window.location.reload();
  }
}

/**
 * Teste la connexion à Supabase
 */
export async function testSupabaseConnection(url = SUPABASE_URL, key = SUPABASE_ANON_KEY) {
  if (!url || !key) return { success: false, message: 'URL ou clé manquante' };
  try {
    const client = createClient(url, key);
    const { data, error } = await client.from('residence_info').select('nom').limit(1);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connexion Supabase réussie !', data };
  } catch (err) {
    return { success: false, message: err.message || 'Erreur de connexion réseau' };
  }
}
