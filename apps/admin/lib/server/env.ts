import "server-only";

const PLACEHOLDER = "Will be provided later";

/** Treat empty strings and the literal placeholder as "not configured". */
export function envValue(name: string): string | undefined {
  const v = process.env[name]?.trim();
  if (!v || v === PLACEHOLDER) return undefined;
  return v;
}

export const env = {
  supabaseUrl: () => envValue("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceKey: () => envValue("SUPABASE_SERVICE_ROLE_KEY"),
  googleMapsKey: () => envValue("GOOGLE_MAPS_API_KEY"),
  sessionSecret: () => envValue("ADMIN_SESSION_SECRET") ?? "dev-only-insecure-secret-change-me-please-32b",
  adminEmail: () => envValue("MAIN_ADMIN_EMAIL") ?? "admin@lasavvy.co.ke",
  adminPassword: () => envValue("MAIN_ADMIN_PASSWORD"),
  cronSecret: () => envValue("CRON_SECRET"),
};

export const isSupabaseConfigured = () => Boolean(env.supabaseUrl() && env.supabaseServiceKey());
