import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TrafficMap } from "@/components/TrafficMap";
import { Button, Card, Chip, Header, T } from "@/components/ui";
import { fetchRouteAndQuotes } from "@/lib/api";
import { useBooking } from "@/lib/booking";
import { C, F, R } from "@/theme";

const QUICK = ["Shangrila Villas, Rongai", "Rongai Town", "Kiserian", "Kitengela", "Karen, Nairobi", "Westlands"];

export default function RouteInput() {
  const { b, set } = useBooking();
  const [from, setFrom] = useState("CBD, Nairobi");
  const [to, setTo] = useState("Shangrila Villas, Rongai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calc = useCallback(
    async (f: string, t: string) => {
      setLoading(true);
      setError("");
      try {
        const r = await fetchRouteAndQuotes(f, t);
        set({ route: r.route, quotes: r.quotes, formula: r.formula, estimate: r.estimate, tier: null });
      } catch {
        setError("Couldn't calculate this route. Try again.");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    calc(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const r = b.route;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title={b.category} subtitle="Where should we go?" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 10 }}>
          <View style={s.field}>
            <Ionicons name="navigate" size={18} color={C.jungle} />
            <TextInput value={from} onChangeText={setFrom} placeholder="From" placeholderTextColor="#8A8A8A" style={s.input} returnKeyType="next" />
          </View>
          <View style={s.connector}>
            <Ionicons name="arrow-down" size={16} color={C.gold} />
          </View>
          <View style={s.field}>
            <Ionicons name="location" size={18} color={C.maroon} />
            <TextInput value={to} onChangeText={setTo} placeholder="To" placeholderTextColor="#8A8A8A" style={s.input} returnKeyType="search" onSubmitEditing={() => calc(from, to)} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {QUICK.map((q) => (
              <Chip key={q} label={q} active={q === to} onPress={() => { setTo(q); calc(from, q); }} />
            ))}
          </ScrollView>
          <Button title="Update route" variant="gold" icon="refresh" onPress={() => calc(from, to)} loading={loading} />
        </Card>

        {!!error && <T style={{ color: C.maroon }}>{error}</T>}
        {loading && !r && <ActivityIndicator color={C.jungle} />}
        {r && (
          <>
            <View style={s.overview}>
              <Text style={s.overviewTitle}>Route overview</Text>
              <Text style={s.overviewMeta}>
                {r.distanceKm}km • ~{r.durationMin} min
              </Text>
            </View>
            <TrafficMap route={r} />
            {r.source === "benchmark" && <T style={{ fontSize: 12, color: C.muted }}>Benchmark route (CBD → Shangrila Villas Rongai, 22km) until Google Maps is connected.</T>}
            <Button title="See fair price" icon="pricetag" onPress={() => router.push("/pricing")} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  field: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: C.border, backgroundColor: "#F7F5F0", borderRadius: R.button, paddingHorizontal: 12, height: 50 },
  input: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.ink },
  connector: { alignItems: "center", marginVertical: -4 },
  overview: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  overviewTitle: { fontFamily: F.heading, fontSize: 20, color: C.ink },
  overviewMeta: { fontFamily: F.body, fontSize: 15, color: C.ink },
});
