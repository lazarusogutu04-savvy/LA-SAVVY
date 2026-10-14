import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const ok = (v?: string) => Boolean(v && v !== "Will be provided later");

export const supabase: SupabaseClient | null =
  ok(url) && ok(anon)
    ? createClient(url!, anon!, { auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
    : null;

export const authDemo = !supabase;

export function toE164(local: string) {
  const d = local.replace(/\D/g, "");
  if (d.startsWith("254")) return `+${d}`;
  if (d.startsWith("0")) return `+254${d.slice(1)}`;
  return `+254${d}`;
}

/** Sends a 6-digit SMS OTP via Supabase Auth (configure an SMS provider, e.g. Twilio / Africa's Talking). */
export async function sendOtp(phone: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
}

export async function verifyOtp(phone: string, token: string) {
  if (!supabase) {
    if (!/^\d{6}$/.test(token)) throw new Error("Enter the 6-digit code");
    await AsyncStorage.setItem("mtaani.demoPhone", phone);
    return;
  }
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw error;
}

export async function signedInPhone(): Promise<string | null> {
  if (supabase) return (await supabase.auth.getSession()).data.session?.user.phone ?? null;
  return AsyncStorage.getItem("mtaani.demoPhone");
}
