import type { PricingConfig, TrafficLevel } from "./types";

/**
 * Ethical, transparent pricing — the ONLY formula a customer ever sees. No surge.
 *   scheduled = base + km × perKm + trafficFee × multiplier + stops × stopFee
 *   instant   = scheduled + instantFee
 */
export const DEFAULT_PRICING: PricingConfig = {
  id: 1,
  base_fee: 80,
  per_km: 12,
  traffic_multiplier: 1,
  stop_fee: 50,
  stop_km: 3,
  instant_fee: 100,
  ethical_mode: true,
  last_saved: null,
};

export const TRAFFIC_FEES: Record<TrafficLevel, number> = { low: 10, medium: 20, high: 40 };

/** ratio = duration_in_traffic / normal duration. >1.5 high, >1.2 medium, else low. */
export function trafficLevelFromRatio(ratio: number): TrafficLevel {
  if (ratio > 1.5) return "high";
  if (ratio > 1.2) return "medium";
  return "low";
}

export interface PriceBreakdown {
  base: number;
  distanceKm: number;
  perKm: number;
  distanceFee: number;
  trafficLevel: TrafficLevel;
  trafficFee: number;
  stopsCount: number;
  stopsFee: number;
  instantFee: number;
  scheduledPrice: number;
  instantPrice: number;
}

export function calcPrice(opts: {
  routeKm: number;
  stopsCount: number;
  trafficLevel: TrafficLevel;
  config?: PricingConfig;
}): PriceBreakdown {
  const c = opts.config ?? DEFAULT_PRICING;
  const distanceKm = Math.max(0, opts.routeKm) + opts.stopsCount * c.stop_km;
  const distanceFee = Math.round(distanceKm * c.per_km);
  const trafficFee = Math.round(TRAFFIC_FEES[opts.trafficLevel] * c.traffic_multiplier);
  const stopsFee = opts.stopsCount * c.stop_fee;
  const scheduledPrice = Math.round(c.base_fee + distanceFee + trafficFee + stopsFee);
  return {
    base: c.base_fee,
    distanceKm: Math.round(distanceKm * 10) / 10,
    perKm: c.per_km,
    distanceFee,
    trafficLevel: opts.trafficLevel,
    trafficFee,
    stopsCount: opts.stopsCount,
    stopsFee,
    instantFee: c.instant_fee,
    scheduledPrice,
    instantPrice: scheduledPrice + c.instant_fee,
  };
}

/** Guess the service zone from the pickup address (used to limit minor admins to their zone). */
export function zoneFromAddress(address: string): string {
  const a = address.toLowerCase();
  if (a.includes("kiserian")) return "Kiserian";
  if (a.includes("kitengela")) return "Kitengela";
  if (a.includes("rongai") || a.includes("ongata")) return "Rongai";
  if (a.includes("cbd") || a.includes("city centre") || a.includes("central business")) return "CBD";
  return "Nairobi Wide";
}
