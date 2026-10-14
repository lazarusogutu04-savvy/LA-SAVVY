import "server-only";
import { BENCHMARK_ROUTE, classifySpeed, type RouteEstimate, type RouteSegment } from "@shared";
import { env } from "./env";

/** Decodes a Google encoded polyline. */
function decode(str: string) {
  let index = 0, lat = 0, lng = 0;
  const out: { latitude: number; longitude: number }[] = [];
  while (index < str.length) {
    for (const which of [0, 1]) {
      let b, shift = 0, result = 0;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += d; else lng += d;
    }
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return out;
}

/**
 * Route + live traffic via Google Directions (departure_time=now). Each step is coloured by
 * its average speed (scaled by the route's traffic ratio). Falls back to the 22 km benchmark
 * route when no API key is configured.
 */
export async function estimateRoute(from: string, to: string): Promise<RouteEstimate> {
  const key = env.googleMapsKey();
  if (!key) return { ...BENCHMARK_ROUTE, fromLabel: from || BENCHMARK_ROUTE.fromLabel, toLabel: to || BENCHMARK_ROUTE.toLabel };

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", from);
  url.searchParams.set("destination", to);
  url.searchParams.set("departure_time", "now");
  url.searchParams.set("region", "ke");
  url.searchParams.set("key", key);
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  const leg = json?.routes?.[0]?.legs?.[0];
  if (!leg) return { ...BENCHMARK_ROUTE, fromLabel: from, toLabel: to };

  const freeSec = leg.duration.value as number;
  const trafficSec = (leg.duration_in_traffic?.value as number) ?? freeSec;
  const ratio = trafficSec / Math.max(freeSec, 1);
  const segments: RouteSegment[] = (leg.steps as { distance: { value: number }; duration: { value: number }; polyline: { points: string } }[]).map((s) => {
    const km = s.distance.value / 1000;
    const kmh = km / ((s.duration.value * ratio) / 3600 || 1);
    return { km: Math.round(km * 10) / 10, congestion: classifySpeed(kmh), coords: decode(s.polyline.points) };
  });
  return {
    fromLabel: leg.start_address,
    toLabel: leg.end_address,
    distanceKm: Math.round((leg.distance.value / 1000) * 10) / 10,
    durationMin: Math.round(trafficSec / 60),
    trafficDelayMin: Math.max(0, Math.round((trafficSec - freeSec) / 60)),
    segments,
    source: "google",
  };
}
