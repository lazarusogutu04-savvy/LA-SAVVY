"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mapsConfigured } from "@/lib/config";
import { loadGoogleMaps } from "@/lib/maps";
import { trafficLevelFromRatio } from "@/lib/pricing";
import type { TrafficLevel } from "@/lib/types";

export interface RouteInfo {
  routeKm: number; // from → to (Google DistanceMatrix), excludes stop extras
  durationMin: number; // duration_in_traffic / 60
  normalMin: number;
  trafficLevel: TrafficLevel;
  live: boolean; // true when calculated by Google Maps
}

interface Props {
  from: string;
  to: string;
  stops: string[];
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onStops: (v: string[]) => void;
  onRoute: (r: RouteInfo | null) => void;
}

/**
 * From / To / multi-stop inputs with Google Places Autocomplete (country: ke) and a live
 * DistanceMatrix calculation (DRIVING, departureTime now, trafficModel BEST_GUESS, METRIC).
 * Without a Maps key it falls back to a manual km estimate so booking still works.
 */
export function RoutePlanner({ from, to, stops, onFrom, onTo, onStops, onRoute }: Props) {
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<google.maps.Map | null>(null);
  const renderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(mapsConfigured ? null : "Google Maps key will be provided later");
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [manualKm, setManualKm] = useState("");
  const [manualTraffic, setManualTraffic] = useState<TrafficLevel>("medium");

  // Latest addresses chosen via Autocomplete (place_changed) or typed.
  const fromAddr = useRef(from);
  const toAddr = useRef(to);
  fromAddr.current = from;
  toAddr.current = to;

  const calcRoute = useCallback(async () => {
    const origin = fromAddr.current.trim();
    const destination = toAddr.current.trim();
    if (!mapsReady || !origin || !destination) return;
    setCalculating(true);
    setCalcError(null);
    try {
      const svc = new google.maps.DistanceMatrixService();
      const res = await svc.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: { departureTime: new Date(), trafficModel: google.maps.TrafficModel.BEST_GUESS },
        unitSystem: google.maps.UnitSystem.METRIC,
      });
      const el = res.rows[0]?.elements[0];
      if (!el || el.status !== "OK") throw new Error("We couldn't find a driving route between those places");
      const km = el.distance.value / 1000;
      const normal = el.duration.value;
      const inTraffic = el.duration_in_traffic?.value ?? normal;
      onRoute({
        routeKm: Math.round(km * 10) / 10,
        durationMin: Math.round(inTraffic / 60),
        normalMin: Math.round(normal / 60),
        trafficLevel: trafficLevelFromRatio(normal > 0 ? inTraffic / normal : 1),
        live: true,
      });
    } catch (e) {
      setCalcError((e as Error).message);
      onRoute(null);
    } finally {
      setCalculating(false);
    }
  }, [mapsReady, onRoute]);

  // Load Maps + attach Autocomplete to the From/To refs.
  useEffect(() => {
    if (!mapsConfigured) return;
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled) return;
        const opts: google.maps.places.AutocompleteOptions = { componentRestrictions: { country: "ke" }, fields: ["formatted_address", "geometry", "name"] };
        const pairs: [HTMLInputElement | null, (v: string) => void, React.MutableRefObject<string>][] = [
          [fromRef.current, onFrom, fromAddr],
          [toRef.current, onTo, toAddr],
        ];
        pairs.forEach(([input, set, ref]) => {
          if (!input) return;
          const ac = new g.maps.places.Autocomplete(input, opts);
          ac.addListener("place_changed", () => {
            const p = ac.getPlace();
            const addr = p.formatted_address || p.name || input.value;
            ref.current = addr;
            set(addr);
            calcRouteRef.current();
          });
        });
        if (mapRef.current) {
          mapObj.current = new g.maps.Map(mapRef.current, {
            center: { lat: -1.3962, lng: 36.7553 }, // Rongai
            zoom: 11,
            disableDefaultUI: true,
            zoomControl: true,
          });
          new g.maps.TrafficLayer().setMap(mapObj.current);
          renderer.current = new g.maps.DirectionsRenderer({
            map: mapObj.current,
            polylineOptions: { strokeColor: "#7A1C1C", strokeWeight: 5 },
          });
        }
        setMapsReady(true);
      })
      .catch((e) => setMapsError((e as Error).message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calcRouteRef = useRef(calcRoute);
  calcRouteRef.current = calcRoute;

  // Recalc on from/to change (debounced for typed input).
  useEffect(() => {
    if (!mapsReady) return;
    const t = setTimeout(() => calcRoute(), 700);
    return () => clearTimeout(t);
  }, [from, to, mapsReady, calcRoute]);

  // Draw the route (with stops as waypoints) on the live map.
  const stopsKey = stops.join("|");
  useEffect(() => {
    if (!mapsReady || !renderer.current || !from.trim() || !to.trim()) return;
    const t = setTimeout(() => {
      const waypoints = stops.filter((s) => s.trim()).map((s) => ({ location: s, stopover: true }));
      const req: google.maps.DirectionsRequest = {
        origin: from,
        destination: to,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: { departureTime: new Date(), trafficModel: google.maps.TrafficModel.BEST_GUESS },
      };
      new google.maps.DirectionsService().route(req, (r, status) => {
        if (status === "OK" && r) renderer.current?.setDirections(r);
      });
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, stopsKey, mapsReady]);

  // Manual fallback (no Maps key yet).
  useEffect(() => {
    if (mapsConfigured && !mapsError) return;
    const km = parseFloat(manualKm);
    if (!from.trim() || !to.trim() || !(km > 0)) return onRoute(null);
    const speed = manualTraffic === "high" ? 15 : manualTraffic === "medium" ? 22 : 30;
    onRoute({ routeKm: km, durationMin: Math.round((km / speed) * 60), normalMin: Math.round((km / 30) * 60), trafficLevel: manualTraffic, live: false });
  }, [manualKm, manualTraffic, from, to, mapsError, onRoute]);

  const setStop = (i: number, v: string) => onStops(stops.map((s, j) => (j === i ? v : s)));

  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-jungle" aria-hidden>↗</span>
        <Input ref={fromRef} aria-label="From" className="pl-9" placeholder="From - e.g. Your location" value={from} onChange={(e) => onFrom(e.target.value)} />
      </div>

      {stops.map((s, i) => (
        <div key={i} className="flex items-center gap-2 pl-4">
          <MapPin className="h-4 w-4 shrink-0 text-gold-600" />
          <Input aria-label={`Stop ${i + 1}`} placeholder={`Stop ${i + 1} - e.g. Supermarket`} value={s} onChange={(e) => setStop(i, e.target.value)} />
          <button type="button" aria-label={`Remove stop ${i + 1}`} onClick={() => onStops(stops.filter((_, j) => j !== i))} className="rounded-full p-2 text-maroon hover:bg-maroon-50">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-maroon" aria-hidden>◎</span>
        <Input ref={toRef} aria-label="To" className="pl-9" placeholder="To - e.g. Destination" value={to} onChange={(e) => onTo(e.target.value)} />
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onStops([...stops, ""])} className="inline-flex items-center gap-1 rounded-btn border border-dashed border-gold px-3 py-1.5 text-sm font-semibold text-jungle hover:bg-gold-100">
          <Plus className="h-4 w-4" /> Add stop
        </button>
        <span className="text-xs text-muted">+KES 50 &amp; +3 km per stop</span>
      </div>

      {mapsConfigured && !mapsError ? (
        <>
          <div ref={mapRef} className="h-48 w-full overflow-hidden rounded-card border border-line bg-mint" aria-label="Live route map" />
          {calculating && (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking live traffic…
            </p>
          )}
          {calcError && <p className="text-xs font-medium text-maroon">{calcError}</p>}
        </>
      ) : (
        <div className="rounded-card border border-dashed border-gold bg-gold-100/50 p-3">
          <p className="text-xs font-semibold text-[#6E5630]">Live Google Maps pricing: {mapsError ?? "loading"}. Enter an approximate distance meanwhile.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input inputMode="decimal" placeholder="Approx km" value={manualKm} onChange={(e) => setManualKm(e.target.value.replace(/[^\d.]/g, ""))} />
            <select
              aria-label="Traffic"
              className="h-11 rounded-btn border border-line bg-white px-3 text-sm"
              value={manualTraffic}
              onChange={(e) => setManualTraffic(e.target.value as TrafficLevel)}
            >
              <option value="low">Traffic: low</option>
              <option value="medium">Traffic: medium</option>
              <option value="high">Traffic: high</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
