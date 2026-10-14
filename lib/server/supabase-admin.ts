import "server-only";
import { createClient } from "@supabase/supabase-js";
import { envValue } from "./env";

/** Service-role client for trusted server routes (M-Pesa). Null until the key is provided. */
export function supabaseAdmin() {
  const url = envValue("NEXT_PUBLIC_SUPABASE_URL");
  const key = envValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
