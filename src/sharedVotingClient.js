import { createClient } from "@supabase/supabase-js";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const hasSharedVotingConfig = Boolean(
  supabaseUrl.startsWith("https://") &&
    supabaseUrl.includes(".supabase.co") &&
    supabaseAnonKey.length > 20
);

export const sharedVoting = hasSharedVotingConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
