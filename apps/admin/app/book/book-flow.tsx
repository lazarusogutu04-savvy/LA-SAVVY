"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, Loader2, MapPin, Navigation, Search } from "lucide-react";
import { ERRAND_CATEGORIES, PLACES, type RouteEstimate, type Tier, type TierQuote } from "@shared";
import { EthicalBadge, EthicalPricing, type Formula } from "@/components/client/ethical-pricing";
import { TrafficMap } from "@/components/client/traffic-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RouteResponse {
  route: RouteEstimate;
  quotes: { scheduled: TierQuote; instant: TierQuote };
  formula: Formula;
}

export function BookFlow() {
  const router = useRouter();
  const [category, setCategory] = useState<string>("Delivery");
  const [from, setFrom] = useState("CBD, Nairobi");
  const [to, setTo] = useState("Shangrila Villas, Rongai");
  const [data, setData] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/public/route", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: f, to: t }) });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Couldn't calculate the route. Check the addresses and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("CBD, Nairobi", "Shangrila Villas, Rongai");
  }, [load]);

  const select = (tier: Tier) => {
    if (!data) return;
    const r = data.route;
    const q = new URLSearchParams({
      tier,
      km: String(r.distanceKm),
      t: String(r.trafficDelayMin),
      from: r.fromLabel,
      to: r.toLabel,
      cat: category,
    });
    router.push(`/book/checkout?${q}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-card bg-jungle p-5 text-white shadow-soft">
        <h1 className="text-2xl">Where should we run your errand?</h1>
        <p className="mt-1 text-sm text-white/80">Fair prices from Rongai to all of Nairobi.</p>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {ERRAND_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold", c === category ? "border-gold bg-gold text-jungle" : "border-gold/60 text-gold")}
            >
              {c}
            </button>
          ))}
        </div>
        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            load(from, to);
          }}
        >
          <div className="relative">
            <Navigation className="absolute left-3 top-3.5 h-4 w-4 text-gold" />
            <Input value={from} onChange={(e) => setFrom(e.target.value)} className="bg-white pl-9" aria-label="From" placeholder="Pickup location" />
          </div>
          <ArrowDown className="mx-auto h-4 w-4 text-gold" />
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-maroon" />
            <Input value={to} onChange={(e) => setTo(e.target.value)} className="bg-white pl-9" aria-label="To" placeholder="Drop-off location" />
          </div>
          <Button type="submit" variant="gold" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Search />} Get fair price
          </Button>
        </form>
      </div>

      {error && <p className="rounded-btn bg-maroon-50 p-3 text-sm font-medium text-maroon">{error}</p>}

      {data && (
        <>
          <div className="flex flex-col items-start gap-2">
            <EthicalBadge />
            <h2 className="text-xl text-jungle">
              {shortLabel(data.route.fromLabel)} → {shortLabel(data.route.toLabel)} • {data.route.distanceKm}km
            </h2>
            <p className="text-sm text-muted">
              ~{data.route.durationMin} min in current traffic
              {data.route.source === "benchmark" && ` • Benchmark route (${PLACES.cbd.label} → ${PLACES.shangrila.label}) until Google Maps is connected`}
            </p>
          </div>
          <TrafficMap segments={data.route.segments} fromLabel={shortLabel(data.route.fromLabel)} toLabel={shortLabel(data.route.toLabel)} />
          <EthicalPricing {...data.quotes} formula={data.formula} distanceKm={data.route.distanceKm} selected={null} onSelect={select} />
        </>
      )}
    </div>
  );
}

function shortLabel(s: string) {
  return s.split(",")[0].replace(" • Nairobi", "");
}
