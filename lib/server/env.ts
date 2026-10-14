import "server-only";
import { configured } from "@/lib/config";

/** Server env value, or undefined when empty / "Will be provided later". */
export function envValue(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return configured(v) ? v : undefined;
}
