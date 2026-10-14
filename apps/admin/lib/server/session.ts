import { SignJWT, jwtVerify } from "jose";
import type { Zone } from "@shared";

export const SESSION_COOKIE = "mtaani_session";
export const SESSION_HOURS = 8;

export interface Session {
  sub: string;
  name: string;
  role: "main_admin" | "minor_admin";
  zone?: Zone;
}

// Edge-safe (used by middleware), so read env directly here.
function secret() {
  const s = process.env.ADMIN_SESSION_SECRET?.trim();
  return new TextEncoder().encode(s && s !== "Will be provided later" ? s : "dev-only-insecure-secret-change-me-please-32b");
}

export async function signSession(s: Session) {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret());
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

/** Pages a Minor Admin may open. Everything else under /admin is Main Admin only. */
export const MINOR_ADMIN_PATHS = ["/admin", "/admin/orders"];
