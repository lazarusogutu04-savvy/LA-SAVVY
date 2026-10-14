import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function waLink(text: string, phone?: string) {
  const to = phone ? phone.replace(/[^\d]/g, "").replace(/^0/, "254") : "";
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

export function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Nairobi" });
}
