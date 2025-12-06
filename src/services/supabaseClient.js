import { createClient } from '@supabase/supabase-js';

// Robust env detection: Vite (import.meta.env) first, then process.env fallback
const env = (typeof import.meta !== 'undefined' && import.meta.env) || (typeof process !== 'undefined' && process.env) || {};

// Support Vite and Next-style prefixes
const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
const bucketName = env.VITE_SUPABASE_BUCKET || env.NEXT_PUBLIC_SUPABASE_BUCKET || 'projects';

// Debug logs to help diagnose configuration issues
if (typeof window !== 'undefined') {
  const urlPresent = !!supabaseUrl;
  const keyPresent = !!supabaseAnonKey;
  console.log('🔌 Supabase config:', { urlPresent, keyPresent, bucketName });
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const hasSupabase = !!supabase;
export const getSupabaseDiagnostics = () => ({
  supabaseUrl,
  supabaseAnonKeyPresent: !!supabaseAnonKey,
  supabaseUrlPresent: !!supabaseUrl,
  bucketName,
});
