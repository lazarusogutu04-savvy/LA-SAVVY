"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Agent } from "@shared";
import { list } from "@/lib/server/db";
import { checkMainAdmin, hashAccessCode, safeEqual } from "@/lib/server/auth";
import { SESSION_COOKIE, SESSION_HOURS, signSession, type Session } from "@/lib/server/session";

export interface LoginState {
  error?: string;
}

async function startSession(s: Session, next: string) {
  cookies().set(SESSION_COOKIE, await signSession(s), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function loginMainAdmin(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const res = checkMainAdmin(email, password);
  if (!res.ok) return { error: res.reason ?? "Invalid email or password" };
  await startSession({ sub: "main_admin", name: "Main Admin", role: "main_admin" }, String(form.get("next") ?? "/admin"));
  return {};
}

/** Minor admins (agents) sign in with their phone + the access code shared by the Main Admin. */
export async function loginMinorAdmin(_: LoginState, form: FormData): Promise<LoginState> {
  const phone = String(form.get("phone") ?? "").replace(/\s/g, "");
  const code = String(form.get("code") ?? "").trim();
  const agents = await list<Agent & { accessCodeHash?: string }>("agents");
  const a = agents.find((x) => x.phone.replace(/\s/g, "") === phone && x.status === "Active");
  if (!a?.accessCodeHash || !safeEqual(a.accessCodeHash, hashAccessCode(code, a.id))) return { error: "Invalid phone or access code" };
  await startSession({ sub: a.id, name: a.name, role: "minor_admin", zone: a.zone }, "/admin/orders");
  return {};
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect("/login");
}
