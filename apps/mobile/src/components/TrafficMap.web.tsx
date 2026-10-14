import { Text, View } from "react-native";
import Svg, { Circle, Polyline, Rect } from "react-native-svg";
import type { RouteEstimate } from "@shared";
import { C } from "@/theme";
import { TRAFFIC_COLOR, TrafficLegend } from "./trafficLegend";
import { s } from "./TrafficMap.styles";

/** Web fallback (react-native-maps is native-only): schematic route with traffic colours. */
export function TrafficMap({ route, height = 220 }: { route: RouteEstimate; height?: number }) {
  const pts = route.segments.flatMap((x) => x.coords);
  if (!pts.length) return null;
  const W = 360, H = height, pad = 30;
  const lats = pts.map((p) => p.latitude), lngs = pts.map((p) => p.longitude);
  const [a, b, c, d] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const k = Math.min((W - pad * 2) / Math.max(d - c, 1e-6), (H - pad * 2) / Math.max(b - a, 1e-6));
  const ox = (W - (d - c) * k) / 2, oy = (H - (b - a) * k) / 2;
  const xy = (p: { latitude: number; longitude: number }) => `${ox + (p.longitude - c) * k},${oy + (b - p.latitude) * k}`;
  const [sx, sy] = xy(pts[0]).split(",").map(Number);
  const [ex, ey] = xy(pts[pts.length - 1]).split(",").map(Number);
  return (
    <View style={s.wrap}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Rect width={W} height={H} fill="#EEF0EA" />
        {route.segments.map((seg, i) => (
          <Polyline key={i} points={seg.coords.map(xy).join(" ")} fill="none" stroke={TRAFFIC_COLOR[seg.congestion]} strokeWidth={7} strokeLinecap="round" />
        ))}
        <Circle cx={sx} cy={sy} r={8} fill={C.jungle} stroke="#fff" strokeWidth={3} />
        <Circle cx={ex} cy={ey} r={8} fill={C.maroon} stroke="#fff" strokeWidth={3} />
      </Svg>
      <View style={s.live}>
        <View style={s.dot} />
        <Text style={s.liveText}>Live traffic</Text>
      </View>
      <TrafficLegend segments={route.segments} />
    </View>
  );
}
