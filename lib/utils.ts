import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** wa.me link. `phone` may be 07..., +2547... or 2547... */
export function waLink(text: string, phone?: string | null) {
  const to = phone ? phone.replace(/[^\d]/g, "").replace(/^0/, "254") : "";
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

/** Kenyan phone → E.164 (+2547XXXXXXXX). Accepts 07..., 7..., 2547..., +2547... */
export function toE164(local: string) {
  const d = local.replace(/\D/g, "");
  if (d.startsWith("254")) return `+${d}`;
  if (d.startsWith("0")) return `+254${d.slice(1)}`;
  return `+254${d}`;
}

export function isKePhone(local: string) {
  return /^\+254(7|1)\d{8}$/.test(toE164(local));
}

export const kes = (n: number) => `KES ${Math.round(n).toLocaleString("en-KE")}`;

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" });
}

export const shortId = (id: string) => id.slice(0, 8).toUpperCase();
