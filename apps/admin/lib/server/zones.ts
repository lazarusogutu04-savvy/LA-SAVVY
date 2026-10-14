import "server-only";
import { ZONES, type Zone } from "@shared";

export function zoneFor(...labels: string[]): Zone {
  const text = labels.join(" ").toLowerCase();
  for (const z of ZONES) if (z !== "Nairobi Wide" && text.includes(z.toLowerCase())) return z;
  if (/(shangrila|tuskys rongai|ongata)/.test(text)) return "Rongai";
  return "Nairobi Wide";
}
