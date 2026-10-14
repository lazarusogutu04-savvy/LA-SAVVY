import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

/** Service-role client. Server-side only: bypasses RLS, so every caller must authorize first. */
export function serviceClient(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl()!, env.supabaseServiceKey()!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
