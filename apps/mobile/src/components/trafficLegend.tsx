import { Text, View } from "react-native";
import type { RouteSegment } from "@shared";
import { C, F } from "@/theme";

export const TRAFFIC_COLOR = { free: C.trafficFree, slow: C.trafficSlow, heavy: C.trafficHeavy } as const;
const LABEL = { free: "Free flowing", slow: "Slow", heavy: "Heavy" } as const;

export function TrafficLegend({ segments }: { segments: RouteSegment[] }) {
  const agg = segments.reduce<{ c: RouteSegment["congestion"]; km: number }[]>((a, s) => {
    const f = a.find((x) => x.c === s.congestion);
    if (f) f.km += s.km;
    else a.push({ c: s.congestion, km: s.km });
    return a;
  }, []);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" }}>
      {agg.map((a) => (
        <View key={a.c} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 18, height: 8, borderRadius: 4, backgroundColor: TRAFFIC_COLOR[a.c] }} />
          <Text style={{ fontFamily: F.bodySemi, fontSize: 12, color: C.ink }}>
            {LABEL[a.c]} • {Math.round(a.km * 10) / 10}km
          </Text>
        </View>
      ))}
    </View>
  );
}
