/**
 * Public runtime config. Every key stays "Will be provided later" until it is issued —
 * the app treats that placeholder (or an empty value) as "not configured" and falls back
 * to demo mode so every page still works.
 */
export const PLACEHOLDER = "Will be provided later";

export function configured(v: string | undefined | null): v is string {
  const t = v?.trim();
  return Boolean(t && t !== PLACEHOLDER);
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const supabaseConfigured = configured(SUPABASE_URL) && configured(SUPABASE_ANON_KEY);
export const mapsConfigured = configured(GOOGLE_MAPS_API_KEY);

export const MAIN_ADMIN_EMAIL = "hello@lasavvy.co.ke";
/** Demo admin password — only accepted while Supabase is NOT configured. */
export const DEMO_ADMIN_PASSWORD = "mtaani-demo";
/** Manual M-Pesa Till shown until Daraja STK keys are provided. */
export const MANUAL_TILL = "123456";
export const STORAGE_BUCKET = "mtaani-files";

export const company = {
  name: "LA & Savvy Limited",
  product: "Mtaani Errands",
  base: "Rongai, Nairobi, Kenya",
  email: "hello@lasavvy.co.ke",
  tagline: "Fair, Transparent, Ethical pricing - No surge",
  footer: `© ${new Date().getFullYear()} LA & Savvy Limited • Rongai, Nairobi, Kenya`,
} as const;
