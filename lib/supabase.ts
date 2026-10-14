import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

/** Browser Supabase client, or null in demo mode (keys "Will be provided later"). */
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export const demoMode = !supabase;
