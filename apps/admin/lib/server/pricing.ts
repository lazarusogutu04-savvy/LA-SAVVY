import "server-only";
import { DEFAULT_PRICING, quoteAll, type PricingConfig, type QuoteInput, type TierQuote } from "@shared";
import { getSetting } from "./db";
import { fairCeiling, type CompetitorBenchmark, type FairCapConfig } from "./fair-cap";

export async function getPricingConfig(): Promise<PricingConfig> {
  return { ...DEFAULT_PRICING, ...(await getSetting<PricingConfig>("pricing_config")) };
}

/**
 * Customer quote. Applies the hidden ethical ceiling server-side. The response contains only
 * the formula lines and, if the ceiling lowered a price, a neutral "Fair-price ceiling" line —
 * never competitor names or prices.
 */
export async function customerQuote(input: QuoteInput) {
  const [cfg, cap, benchmarks] = await Promise.all([
    getPricingConfig(),
    getSetting<FairCapConfig>("fair_cap"),
    getSetting<CompetitorBenchmark[]>("competitor_benchmarks"),
  ]);
  const q = quoteAll(input, cfg);
  const ceiling = fairCeiling(input.distanceKm, cap, benchmarks);
  const apply = (t: TierQuote): TierQuote => {
    if (ceiling == null || t.total <= ceiling) return t;
    return { ...t, lines: [...t.lines, { label: "Fair-price ceiling", amount: ceiling - t.total }], total: ceiling };
  };
  return { scheduled: apply(q.scheduled), instant: apply(q.instant), config: clientPricing(cfg) };
}

/** Admin-only preview including the internal ceiling. */
export async function adminQuotePreview(input: QuoteInput) {
  const [cap, benchmarks] = await Promise.all([getSetting<FairCapConfig>("fair_cap"), getSetting<CompetitorBenchmark[]>("competitor_benchmarks")]);
  const raw = quoteAll(input, await getPricingConfig());
  return { raw, ceiling: fairCeiling(input.distanceKm, cap, benchmarks), customer: await customerQuote(input) };
}

export function clientPricing(cfg: PricingConfig) {
  return { baseFee: cfg.baseFee, perKm: cfg.perKm, trafficRate: cfg.trafficRate };
}
