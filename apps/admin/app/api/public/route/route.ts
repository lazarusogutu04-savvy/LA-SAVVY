import { body, json, str } from "@/lib/server/http";
import { customerQuote } from "@/lib/server/pricing";
import { estimateRoute } from "@/lib/server/routes";

export const dynamic = "force-dynamic";

/** POST { from, to } → route with traffic segments + ethical quotes. */
export async function POST(req: Request) {
  const b = await body(req);
  const route = await estimateRoute(str(b.from), str(b.to));
  const q = await customerQuote({ distanceKm: route.distanceKm, trafficDelayMin: route.trafficDelayMin });
  return json({ route, quotes: { scheduled: q.scheduled, instant: q.instant }, formula: q.config });
}
