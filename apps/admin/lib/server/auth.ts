import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env, isSupabaseConfigured } from "./env";
import { SESSION_COOKIE, verifySession, type Session } from "./session";

export const DEMO_PASSWORD = "mtaani-demo";

const digest = (s: string) => createHash("sha256").update(s).digest();
export function safeEqual(a: string, b: string) {
  return timingSafeEqual(digest(a), digest(b));
}

export function hashAccessCode(code: string, salt: string) {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

/** True when the portal is running on demo credentials (no MAIN_ADMIN_PASSWORD set). */
export const usingDemoPassword = () => !env.adminPassword();

export function checkMainAdmin(email: string, password: string): { ok: boolean; reason?: string } {
  const expected = env.adminPassword();
  if (!expected && isSupabaseConfigured()) {
    return { ok: false, reason: "Set MAIN_ADMIN_PASSWORD in your environment before signing in to live data." };
  }
  const ok = safeEqual(email.trim().toLowerCase(), env.adminEmail().toLowerCase()) && safeEqual(password, expected ?? DEMO_PASSWORD);
  return { ok };
}

export async function getSession(): Promise<Session | null> {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireMainAdmin(): Promise<Session> {
  const s = await requireSession();
  if (s.role !== "main_admin") redirect("/admin?denied=1");
  return s;
}
