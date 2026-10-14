"use client";
import { DEMO_ADMIN_PASSWORD, MAIN_ADMIN_EMAIL } from "./config";
import { findAgentForLogin } from "./data";
import { supabase } from "./supabase";
import { MAIN_ADMIN_ROLE, type AdminSession } from "./types";
import { toE164 } from "./utils";

const DEMO_CUSTOMER = "mtaani.demoCustomer";
const DEMO_ADMIN = "mtaani.demoAdmin";
const PENDING_PHONE = "mtaani.pendingPhone";

export interface Customer {
  id: string;
  phone: string;
}

// ── Customer: phone OTP ──────────────────────────────────────────────────────
/** Sends a 6-digit SMS code via supabase.auth.signInWithOtp (Kenya +254 formatting). */
export async function sendOtp(localPhone: string) {
  const phone = toE164(localPhone);
  sessionStorage.setItem(PENDING_PHONE, phone);
  if (!supabase) return phone; // demo: any 6-digit code works
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw new Error(error.message);
  return phone;
}

export async function verifyOtp(phone: string, token: string) {
  if (!/^\d{6}$/.test(token)) throw new Error("Enter the 6-digit code");
  if (!supabase) {
    localStorage.setItem(DEMO_CUSTOMER, JSON.stringify({ id: `demo-${phone}`, phone }));
    return;
  }
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw new Error(error.message);
}

export async function getCustomer(): Promise<Customer | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const u = data.session?.user;
    if (!u) return null;
    return { id: u.id, phone: u.phone ? toE164(u.phone) : u.email ?? "" };
  }
  try {
    const raw = localStorage.getItem(DEMO_CUSTOMER);
    return raw ? (JSON.parse(raw) as Customer) : null;
  } catch {
    return null;
  }
}

/** Logout everywhere (customer + admin) via supabase.auth.signOut. */
export async function signOut() {
  if (supabase) await supabase.auth.signOut();
  localStorage.removeItem(DEMO_CUSTOMER);
  localStorage.removeItem(DEMO_ADMIN);
}

// ── Admin: email + password ──────────────────────────────────────────────────
export async function adminSignIn(email: string, password: string): Promise<AdminSession> {
  const e = email.trim().toLowerCase();
  if (!supabase) {
    if (e !== MAIN_ADMIN_EMAIL || password !== DEMO_ADMIN_PASSWORD) {
      throw new Error(`Demo mode: sign in with ${MAIN_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);
    }
    const s: AdminSession = { email: e, name: "Main Admin", role: MAIN_ADMIN_ROLE, zone: null, isMain: true, demo: true };
    localStorage.setItem(DEMO_ADMIN, JSON.stringify(s));
    return s;
  }
  const { error } = await supabase.auth.signInWithPassword({ email: e, password });
  if (error) throw new Error(error.message);
  const s = await getAdminSession();
  if (!s) {
    await supabase.auth.signOut();
    throw new Error("This account is not an admin. Ask the Main Admin to add you to the agents table.");
  }
  return s;
}

/** Admin = agents row with role 'Main Admin' (or the hello@lasavvy.co.ke account); minor admins are zone-limited. */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (!supabase) {
    try {
      const raw = localStorage.getItem(DEMO_ADMIN);
      return raw ? (JSON.parse(raw) as AdminSession) : null;
    } catch {
      return null;
    }
  }
  const { data } = await supabase.auth.getSession();
  const u = data.session?.user;
  if (!u) return null;
  const email = (u.email ?? "").toLowerCase();
  const agent = await findAgentForLogin(u.id, email).catch(() => null);
  if (email === MAIN_ADMIN_EMAIL || agent?.role === MAIN_ADMIN_ROLE) {
    return { email, name: agent?.name ?? "Main Admin", role: MAIN_ADMIN_ROLE, zone: null, isMain: true, demo: false };
  }
  if (agent && agent.status !== "Inactive") {
    return { email, name: agent.name, role: agent.role, zone: agent.zone, isMain: false, demo: false };
  }
  return null;
}
