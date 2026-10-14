import "server-only";
import type { Supplier } from "@shared";

export const EXPIRY_WARNING_DAYS = 30;

export function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

export function expiringDocs(s: Supplier) {
  return s.documents
    .map((d) => ({ ...d, days: daysUntil(d.expiresOn) }))
    .filter((d) => d.days != null && d.days <= EXPIRY_WARNING_DAYS);
}
