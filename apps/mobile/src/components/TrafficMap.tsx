import { Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import type { RouteEstimate } from "@shared";
import { C } from "@/theme";
import { s } from "./TrafficMap.styles";
import { TRAFFIC_COLOR, TrafficLegend } from "./trafficLegend";

/** Native route preview: Google/Apple map with green/yellow/red live-traffic polylines. */
export function TrafficMap({ route, height = 220 }: { route: RouteEstimate; height?: number }) {
  const pts = route.segments.flatMap((s) => s.coords);
  if (!pts.length) return null;
  const lats = pts.map((p) => p.latitude), lngs = pts.map((p) => p.longitude);
  const region = {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitudeDelta: (Math.max(...lats) - Math.min(...lats)) * 1.5 + 0.01,
    longitudeDelta: (Math.max(...lngs) - Math.min(...lngs)) * 1.5 + 0.01,
  };
  return (
    <View style={s.wrap}>
      <MapView style={{ height }} provider={PROVIDER_DEFAULT} initialRegion={region} showsTraffic={false} pointerEvents="none" toolbarEnabled={false}>
        {route.segments.map((seg, i) => (
          <Polyline key={i} coordinates={seg.coords} strokeColor={TRAFFIC_COLOR[seg.congestion]} strokeWidth={6} lineCap="round" />
        ))}
        <Marker coordinate={pts[0]} title={route.fromLabel} pinColor={C.jungle} />
        <Marker coordinate={pts[pts.length - 1]} title={route.toLabel} pinColor={C.maroon} />
      </MapView>
      <View style={s.live}>
        <View style={s.dot} />
        <Text style={s.liveText}>Live traffic</Text>
      </View>
      <TrafficLegend segments={route.segments} />
    </View>
  );
}

