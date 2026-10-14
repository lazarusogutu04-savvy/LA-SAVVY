import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { company, ERRAND_CATEGORIES } from "@shared";
import { LogoMark } from "@/components/Logo";
import { Card, EthicalBadge, H, T } from "@/components/ui";
import { fetchRouteAndQuotes } from "@/lib/api";
import { useBooking } from "@/lib/booking";
import { C, F, R, shadow } from "@/theme";

const ICON: Record<(typeof ERRAND_CATEGORIES)[number], keyof typeof Ionicons.glyphMap> = {
  Delivery: "cube-outline",
  Shopping: "cart-outline",
  "Bill Pay": "receipt-outline",
  Pickup: "bicycle-outline",
  Tours: "map-outline",
  BnB: "bed-outline",
};

export default function Home() {
  const insets = useSafeAreaInsets();
  const { b, set } = useBooking();
  const [q, setQ] = useState("");
  const [bench, setBench] = useState<{ s: number; i: number } | null>(null);
  useEffect(() => {
    fetchRouteAndQuotes("CBD, Nairobi", "Shangrila Villas, Rongai").then((r) => setBench({ s: r.quotes.scheduled.total, i: r.quotes.instant.total }));
  }, []);
  const go = (category: string) => {
    set({ category });
    router.push("/route");
  };
  const matches = ERRAND_CATEGORIES.filter((c) => c.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.cream }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={s.brandRow}>
          <LogoMark size={44} />
          <View>
            <Text style={s.brand}>LA & SAVVY LIMITED</Text>
            <Text style={s.brandSub}>Mtaani Errands</Text>
          </View>
        </View>
        <View style={s.coverage}>
          <Ionicons name="location-outline" size={16} color={C.gold} />
          <Text style={s.coverageText}>Rongai, Nairobi • Coverage active</Text>
        </View>
        <View style={s.search}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search errand: delivery, shopping, bills…" placeholderTextColor="#8A8A8A" style={s.searchInput} returnKeyType="search" onSubmitEditing={() => matches[0] && go(matches[0])} />
        </View>
      </View>

      <View style={{ padding: 16, gap: 16 }}>
        <H style={{ color: C.jungle, fontSize: 20 }}>Errand categories</H>
        <View style={s.grid}>
          {matches.map((c) => (
            <Pressable key={c} onPress={() => go(c)} style={({ pressed }) => [s.cat, b.category === c && s.catActive, pressed && { opacity: 0.85 }]}>
              <View style={[s.catIcon, b.category === c && { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Ionicons name={ICON[c]} size={24} color={C.gold} />
              </View>
              <Text style={[s.catText, b.category === c && { color: "#fff" }]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => go(b.category)}>
          <Card style={{ backgroundColor: C.mint, borderColor: "#CFE6D1" }}>
            <EthicalBadge />
            <H style={{ fontSize: 18, marginTop: 10, color: C.jungle }}>CBD → Shangrila Villas, Rongai</H>
            <T style={{ marginTop: 2 }}>
              22km • <Text style={{ fontFamily: F.heading, color: C.maroon }}>KES {bench?.s ?? "…"}</Text> scheduled • <Text style={{ fontFamily: F.heading, color: C.maroon }}>KES {bench?.i ?? "…"}</Text> instant
            </T>
            <T style={{ marginTop: 6, color: C.muted, fontSize: 13 }}>One transparent formula. No surge pricing. Fair pay for riders.</T>
          </Card>
        </Pressable>
        <Text style={s.foot}>{company.footer}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: C.jungle, paddingHorizontal: 16, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { fontFamily: F.heading, color: C.gold, fontSize: 16, letterSpacing: 1 },
  brandSub: { fontFamily: F.body, color: "rgba(255,255,255,0.8)", fontSize: 12 },
  coverage: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  coverageText: { fontFamily: F.bodySemi, color: "#fff", fontSize: 14 },
  search: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: R.button, paddingHorizontal: 12, height: 50 },
  searchInput: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cat: { width: "31%", flexGrow: 1, backgroundColor: "#fff", borderRadius: R.card, padding: 14, alignItems: "flex-start", gap: 10, borderWidth: 1, borderColor: C.border, ...shadow },
  catActive: { backgroundColor: C.maroon, borderColor: C.maroon },
  catIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.jungle, alignItems: "center", justifyContent: "center" },
  catText: { fontFamily: F.semi, fontSize: 14, color: C.ink },
  foot: { textAlign: "center", fontFamily: F.body, color: C.muted, fontSize: 12, marginTop: 8 },
});
