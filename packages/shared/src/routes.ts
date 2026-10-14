export type Congestion = "free" | "slow" | "heavy";

export interface RouteSegment {
  congestion: Congestion;
  km: number;
  coords: { latitude: number; longitude: number }[];
}

export interface RouteEstimate {
  fromLabel: string;
  toLabel: string;
  distanceKm: number;
  durationMin: number;
  trafficDelayMin: number;
  segments: RouteSegment[];
  source: "google" | "benchmark";
}

export const PLACES = {
  cbd: { label: "CBD • Nairobi", latitude: -1.28333, longitude: 36.81667 },
  shangrila: { label: "Rongai • Shangrila Villas", latitude: -1.39641, longitude: 36.75812 },
} as const;

/** Benchmark route used when Google Maps is not configured (22 km, CBD → Shangrila Villas Rongai). */
export const BENCHMARK_ROUTE: RouteEstimate = {
  fromLabel: PLACES.cbd.label,
  toLabel: PLACES.shangrila.label,
  distanceKm: 22,
  durationMin: 48,
  trafficDelayMin: 36,
  source: "benchmark",
  segments: [
    {
      congestion: "free",
      km: 8,
      coords: [
        { latitude: -1.28333, longitude: 36.81667 },
        { latitude: -1.2995, longitude: 36.8075 },
        { latitude: -1.3155, longitude: 36.7945 },
      ],
    },
    {
      congestion: "slow",
      km: 7,
      coords: [
        { latitude: -1.3155, longitude: 36.7945 },
        { latitude: -1.3355, longitude: 36.7845 },
        { latitude: -1.3555, longitude: 36.7745 },
      ],
    },
    {
      congestion: "heavy",
      km: 7,
      coords: [
        { latitude: -1.3555, longitude: 36.7745 },
        { latitude: -1.3765, longitude: 36.7665 },
        { latitude: -1.39641, longitude: 36.75812 },
      ],
    },
  ],
};

export function classifySpeed(kmh: number): Congestion {
  if (kmh >= 35) return "free";
  if (kmh >= 18) return "slow";
  return "heavy";
}
