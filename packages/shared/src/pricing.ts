import type { Tier } from "./types";

/**
 * Ethical, transparent pricing formula — the ONLY pricing logic customers ever see.
 *
 *   price = base fee + (distance km × per-km rate) + (traffic minutes × traffic rate) + tier adjustment
 *
 * Scheduled Standard rides are pooled with nearby errands and dispatched inside an hour
 * window that avoids peak congestion, so they carry a smaller traffic share and a
 * pooled-batch saving. Instant Premium uses the live traffic delay and a dedicated rider.
 *
 * Benchmark (CBD → Shangrila Villas, Rongai, 22 km, 36 min live traffic delay):
 *   Scheduled: 80 + 22×12 (264) + 16 traffic − 80 pooled saving = KES 280
 *   Instant:   80 + 22×12 (264) + 36 traffic                   = KES 380
 *
 * Competitor benchmarking is a separate server-only ceiling (apps/admin/lib/server/fair-cap.ts)
 * and must never be imported into client code.
 */
export interface PricingConfig {
  baseFee: number; // KES
  perKm: number; // KES per km
  trafficRate: number; // KES per minute of traffic delay ("traffic × 1")
  scheduled: TierConfig;
  instant: TierConfig;
  /** Prices are rounded to the nearest N shillings. */
  roundTo: number;
}

export interface TierConfig {
  label: string;
  eta: string;
  mode: string;
  /** Share of the live traffic delay this tier is exposed to (scheduled windows avoid peaks). */
  trafficFactor: number;
  /** Urgency fee (+) or pooled-batch saving (−), in KES. */
  urgencyFee: number;
  urgencyLabel: string;
  bullets: string[];
}

export const DEFAULT_PRICING: PricingConfig = {
  baseFee: 80,
  perKm: 12,
  trafficRate: 1,
  roundTo: 10,
  scheduled: {
    label: "Scheduled Standard",
    eta: "60-90 min",
    mode: "Batch Delivery",
    trafficFactor: 0.45,
    urgencyFee: -80,
    urgencyLabel: "Pooled batch saving",
    bullets: [
      "Pooled with nearby errands",
      "Eco-efficient, lower carbon",
      "Scheduled within an hour window",
      "Best value for non-urgent errands",
    ],
  },
  instant: {
    label: "Instant Premium",
    eta: "25-40 min",
    mode: "Direct Delivery",
    trafficFactor: 1,
    urgencyFee: 0,
    urgencyLabel: "Priority dispatch",
    bullets: [
      "Immediate dispatch & dedicated rider",
      "Priority handling",
      "Fastest delivery",
      "Real-time tracking",
    ],
  },
};

export interface PriceLine {
  label: string;
  amount: number;
}

export interface TierQuote {
  tier: Tier;
  label: string;
  eta: string;
  mode: string;
  bullets: string[];
  lines: PriceLine[];
  total: number;
}

export interface QuoteInput {
  distanceKm: number;
  /** Live traffic delay in minutes (duration in traffic − free-flow duration). */
  trafficDelayMin: number;
}

function roundTo(n: number, step: number) {
  return step > 1 ? Math.round(n / step) * step : Math.round(n);
}

export function quoteTier(tier: Tier, input: QuoteInput, cfg: PricingConfig = DEFAULT_PRICING): TierQuote {
  const t = cfg[tier];
  const km = Math.max(0, Math.round(input.distanceKm * 10) / 10);
  const distance = Math.round(km * cfg.perKm);
  const trafficMin = Math.round(Math.max(0, input.trafficDelayMin) * t.trafficFactor);
  const traffic = Math.round(trafficMin * cfg.trafficRate);
  const lines: PriceLine[] = [
    { label: "Base fee", amount: cfg.baseFee },
    { label: `Distance (${km}km × ${cfg.perKm})`, amount: distance },
    { label: `Traffic (${trafficMin} min × ${cfg.trafficRate})`, amount: traffic },
  ];
  if (t.urgencyFee !== 0) lines.push({ label: t.urgencyLabel, amount: t.urgencyFee });
  const raw = lines.reduce((s, l) => s + l.amount, 0);
  const total = Math.max(cfg.baseFee, roundTo(raw, cfg.roundTo));
  if (total !== raw) lines.push({ label: "Rounding", amount: total - raw });
  return { tier, label: t.label, eta: t.eta, mode: t.mode, bullets: t.bullets, lines, total };
}

export function quoteAll(input: QuoteInput, cfg: PricingConfig = DEFAULT_PRICING) {
  return { scheduled: quoteTier("scheduled", input, cfg), instant: quoteTier("instant", input, cfg) };
}

export function formatKes(n: number) {
  return `KES ${Math.round(n).toLocaleString("en-KE")}`;
}
