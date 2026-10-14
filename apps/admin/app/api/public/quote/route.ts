import { bad, body, json, num } from "@/lib/server/http";
import { customerQuote } from "@/lib/server/pricing";

export const dynamic = "force-dynamic";

/** POST { distanceKm, trafficDelayMin } → ethical quotes for both tiers. */
export async function POST(req: Request) {
  const b = await body(req);
  const distanceKm = num(b.distanceKm, 0.1, 300);
  const trafficDelayMin = num(b.trafficDelayMin ?? 0, 0, 600);
  if (distanceKm == null || trafficDelayMin == null) return bad("distanceKm (0.1–300) and trafficDelayMin are required");
  const q = await customerQuote({ distanceKm, trafficDelayMin });
  return json({ scheduled: q.scheduled, instant: q.instant, formula: q.config });
}
