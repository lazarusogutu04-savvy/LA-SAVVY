"use client";
import { Clock, Zap } from "lucide-react";
import type { PriceBreakdown } from "@/lib/pricing";
import { cn, kes } from "@/lib/utils";
import type { RouteInfo } from "./route-planner";

const TRAFFIC_LABEL = { low: "Low", medium: "Medium", high: "High" } as const;

export function PriceCard({
  from,
  to,
  route,
  price,
  isInstant,
  onInstant,
}: {
  from: string;
  to: string;
  route: RouteInfo;
  price: PriceBreakdown;
  isInstant: boolean;
  onInstant: (v: boolean) => void;
}) {
  const short = (s: string) => s.split(",")[0];
  return (
    <div className="space-y-3 rounded-card border border-line bg-white p-4 shadow-soft">
      <span className="inline-block rounded-full bg-gold px-3 py-1 text-[11px] font-bold tracking-wide text-jungle">
        ETHICAL • TRANSPARENT • FAIR • Traffic: {TRAFFIC_LABEL[price.trafficLevel]}
      </span>
      <div>
        <h3 className="text-base text-jungle">
          {short(from)} → {short(to)}
        </h3>
        <p className="text-sm text-muted">
          {price.distanceKm} km{price.stopsCount > 0 && ` • ${price.stopsCount} stop${price.stopsCount > 1 ? "s" : ""}`} • ~{route.durationMin} min in current traffic
        </p>
        <p className="text-[11px] font-semibold text-jungle">{route.live ? "● Live via Google Maps" : "Estimate — live Google Maps pricing activates once the key is added"}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { instant: false, title: "SCHEDULED", sub: "STANDARD", amount: price.scheduledPrice, time: "60-90 min", note: "Batch", icon: Clock },
          { instant: true, title: "INSTANT", sub: "PREMIUM", amount: price.instantPrice, time: "25-40 min", note: "Direct", icon: Zap },
        ].map((t) => (
          <button
            key={t.title}
            type="button"
            onClick={() => onInstant(t.instant)}
            aria-pressed={isInstant === t.instant}
            className={cn(
              "rounded-card border-2 p-3 text-left transition-colors",
              isInstant === t.instant ? "border-maroon bg-maroon-50" : "border-line bg-white hover:border-gold"
            )}
          >
            <p className="flex items-center gap-1 text-[11px] font-bold tracking-wide text-jungle">
              <t.icon className="h-3.5 w-3.5 text-gold-600" /> {t.title}
            </p>
            <p className="text-[10px] font-semibold text-muted">{t.sub}</p>
            <p className="mt-1 font-heading text-xl font-bold text-maroon">{kes(t.amount)}</p>
            <p className="text-xs text-muted">
              {t.time} • {t.note}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-btn bg-mint p-3 text-xs text-jungle">
        <p className="mb-1 font-bold">How we calculate</p>
        <div className="grid grid-cols-[1fr_auto] gap-y-0.5">
          <span>Base</span>
          <span>{kes(price.base)}</span>
          <span>
            {price.distanceKm} km × {price.perKm}
          </span>
          <span>{kes(price.distanceFee)}</span>
          <span>Traffic ({TRAFFIC_LABEL[price.trafficLevel].toLowerCase()})</span>
          <span>{kes(price.trafficFee)}</span>
          <span>Stops ({price.stopsCount})</span>
          <span>{kes(price.stopsFee)}</span>
          <span>Instant</span>
          <span>{kes(isInstant ? price.instantFee : 0)}</span>
          <span className="border-t border-jungle/20 pt-1 font-bold">Total</span>
          <span className="border-t border-jungle/20 pt-1 font-bold text-maroon">{kes(isInstant ? price.instantPrice : price.scheduledPrice)}</span>
        </div>
        <p className="mt-1.5 text-[10px] text-muted">No surge. Ever. Same formula for everyone.</p>
      </div>
    </div>
  );
}
