import type { RouteSegment } from "@shared";

const COLORS = { free: "#2E9D4F", slow: "#F2B33D", heavy: "#D93A2B" } as const;
const LABELS = { free: "Free flowing", slow: "Slow", heavy: "Heavy" } as const;

/** Schematic route preview with live-traffic colouring (works without a Maps key). */
export function TrafficMap({ segments, fromLabel, toLabel }: { segments: RouteSegment[]; fromLabel: string; toLabel: string }) {
  const pts = segments.flatMap((s) => s.coords);
  if (!pts.length) return null;
  const W = 640, H = 320, pad = 56;
  const lats = pts.map((p) => p.latitude), lngs = pts.map((p) => p.longitude);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const sx = (W - pad * 2) / Math.max(maxLng - minLng, 1e-6);
  const sy = (H - pad * 2) / Math.max(maxLat - minLat, 1e-6);
  const s = Math.min(sx, sy);
  const ox = (W - (maxLng - minLng) * s) / 2, oy = (H - (maxLat - minLat) * s) / 2;
  const xy = (p: { latitude: number; longitude: number }) => [ox + (p.longitude - minLng) * s, oy + (maxLat - p.latitude) * s] as const;
  const start = xy(pts[0]), end = xy(pts[pts.length - 1]);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-[#EEF0EA]">
      <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Route from ${fromLabel} to ${toLabel}`}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#DCDFD6" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        <circle cx={W * 0.12} cy={H * 0.75} r="70" fill="#D5E8D4" />
        <circle cx={W * 0.88} cy={H * 0.18} r="55" fill="#D5E8D4" />
        <path d={`M${W * 0.8} 0 C ${W * 0.72} ${H * 0.4}, ${W * 0.95} ${H * 0.7}, ${W * 0.78} ${H}`} stroke="#F1D58A" strokeWidth="6" fill="none" />
        {segments.map((seg, i) => (
          <polyline key={i} points={seg.coords.map((c) => xy(c).join(",")).join(" ")} fill="none" stroke={COLORS[seg.congestion]} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {[start, end].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="11" fill={i ? "#7A1C1C" : "#0F3D2E"} stroke="#fff" strokeWidth="3" />
          </g>
        ))}
      </svg>
      <span className="absolute left-3 top-3 max-w-[45%] truncate rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow">{fromLabel}</span>
      <span className="absolute bottom-3 right-3 max-w-[55%] truncate rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow">{toLabel}</span>
      <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#2E9D4F] shadow">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#2E9D4F]" /> Live traffic
      </span>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line bg-white px-3 py-2 text-xs">
        {segments
          .reduce<{ c: RouteSegment["congestion"]; km: number }[]>((acc, sg) => {
            const f = acc.find((a) => a.c === sg.congestion);
            if (f) f.km += sg.km; else acc.push({ c: sg.congestion, km: sg.km });
            return acc;
          }, [])
          .map((a) => (
            <span key={a.c} className="flex items-center gap-1.5 font-medium">
              <span className="h-2.5 w-5 rounded-full" style={{ background: COLORS[a.c] }} />
              {LABELS[a.c]} • {Math.round(a.km * 10) / 10}km
            </span>
          ))}
      </div>
    </div>
  );
}
