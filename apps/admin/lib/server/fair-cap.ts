import "server-only";
/**
 * INTERNAL — Main Admin + backend only. Never import from client components, never return
 * competitor names or prices from a public API route.
 *
 * Ethical ceiling: customerPrice = min(formulaPrice, competitorAvg × capFactor)
 * Competitor averages are benchmarks for the 22 km CBD → Shangrila Villas route and are
 * scaled linearly by distance for other routes.
 */
export interface CompetitorBenchmark {
  name: string;
  minKes: number;
  maxKes: number;
}

export interface FairCapConfig {
  /** Ethical mode: competitors are hidden from clients (always true for client APIs). */
  ethicalMode: boolean;
  /** Apply the competitor-based ceiling to customer prices. */
  capEnabled: boolean;
  /** 0.85 = stay 15% below the competitor average. */
  capFactor: number;
  benchmarkKm: number;
}

export const DEFAULT_FAIR_CAP: FairCapConfig = { ethicalMode: true, capEnabled: true, capFactor: 0.85, benchmarkKm: 22 };

export const DEFAULT_BENCHMARKS: CompetitorBenchmark[] = [
  { name: "Glovo", minKes: 350, maxKes: 450 },
  { name: "Uber", minKes: 380, maxKes: 480 },
  { name: "Bolt", minKes: 250, maxKes: 350 },
];

export function competitorAverage(benchmarks: CompetitorBenchmark[]) {
  if (!benchmarks.length) return null;
  const mids = benchmarks.map((b) => (b.minKes + b.maxKes) / 2);
  return mids.reduce((a, b) => a + b, 0) / mids.length;
}

/** Returns the ceiling in KES for a route of `distanceKm`, or null when no cap applies. */
export function fairCeiling(distanceKm: number, cap: FairCapConfig, benchmarks: CompetitorBenchmark[]) {
  if (!cap.capEnabled) return null;
  const avg = competitorAverage(benchmarks);
  if (avg == null) return null;
  const scaled = avg * (distanceKm / (cap.benchmarkKm || 22));
  return Math.floor((scaled * cap.capFactor) / 10) * 10;
}
