const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const hasSharedVotingConfig = Boolean(
  supabaseUrl.startsWith("https://") &&
    supabaseUrl.includes(".supabase.co") &&
    supabaseAnonKey.length > 20 &&
    window.supabase?.createClient
);

export const sharedVoting = hasSharedVotingConfig
  ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
  : null;
