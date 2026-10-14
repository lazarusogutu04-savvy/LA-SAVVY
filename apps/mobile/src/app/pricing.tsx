import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatKes, type Tier, type TierQuote } from "@shared";
import { Button, Card, EthicalBadge, H, Header, T } from "@/components/ui";
import { useBooking } from "@/lib/booking";
import { C, F, R } from "@/theme";

const short = (s: string) => s.split(",")[0].replace(" • Nairobi", "").replace("Rongai • ", "");

/**
 * Ethical Pricing screen — exactly two options and the transparent formula.
 * NO competitor names, prices or comparisons are ever shown to clients.
 */
export default function Pricing() {
  const { b, set } = useBooking();
  if (!b.route || !b.quotes || !b.formula) return <Redirect href="/route" />;
  const { route, quotes, formula } = b;

  const select = (tier: Tier) => {
    set({ tier });
    router.push("/checkout");
  };
  const distanceAmt = quotes.scheduled.lines[1]?.amount ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <Header title="Pricing" right={<Ionicons name="help-circle-outline" size={26} color="#fff" />} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <EthicalBadge />
        <H style={{ fontSize: 19, color: C.jungle }}>
          {short(route.fromLabel)} → {short(route.toLabel)} • {route.distanceKm}km
        </H>
        {b.estimate && <T style={{ fontSize: 12, color: C.muted }}>Estimate (offline). Final price confirmed at checkout.</T>}

        <TierCard q={quotes.scheduled} icon="leaf-outline" onSelect={select} />
        <TierCard q={quotes.instant} icon="flash-outline" onSelect={select} />

        <Card style={{ backgroundColor: C.mint, borderColor: "#CFE6D1" }}>
          <H style={{ fontSize: 17, color: C.jungle }}>How we calculate price</H>
          <View style={s.formula}>
            <Text style={s.formulaText}>
              Base {formula.baseFee} + distance ×{formula.perKm} + traffic ×{formula.trafficRate} = Total
            </Text>
          </View>
          <T style={{ fontSize: 14 }}>
            Example: Base {formula.baseFee} + {route.distanceKm}km×{formula.perKm}={distanceAmt} + traffic
          </T>
          {[quotes.scheduled, quotes.instant].map((q) => (
            <View key={q.tier} style={s.exRow}>
              <Text style={s.exLabel}>Total {q.tier === "scheduled" ? "Scheduled" : "Instant"}</Text>
              <Text style={s.exSum}>
                {q.lines.map((l, i) => (i === 0 ? `${l.amount}` : l.amount < 0 ? `−${-l.amount}` : `+${l.amount}`)).join("")}=<Text style={{ color: C.maroon, fontFamily: F.heading }}>{q.total}</Text>
              </Text>
            </View>
          ))}
          <View style={{ marginTop: 6, gap: 2 }}>
            {[quotes.scheduled, quotes.instant].flatMap((q) => q.lines.filter((l) => l.amount < 0).map((l) => (
              <T key={q.tier + l.label} style={{ fontSize: 12, color: C.muted }}>
                {q.tier === "scheduled" ? "Scheduled" : "Instant"}: {l.label} −{-l.amount}
              </T>
            )))}
          </View>
        </Card>

        <Card style={{ alignItems: "center", gap: 10 }}>
          <T style={{ textAlign: "center", fontSize: 14 }}>
            We price fairly to support riders with fair pay • Transparent formula • No dynamic surge pricing • All prices inclusive
          </T>
          <View style={s.guarantee}>
            <Ionicons name="checkmark-circle" size={20} color={C.gold} />
            <Text style={s.guaranteeText}>Ethical Pricing Guarantee</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function TierCard({ q, icon, onSelect }: { q: TierQuote; icon: keyof typeof Ionicons.glyphMap; onSelect: (t: Tier) => void }) {
  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={s.tierLabel}>{q.label.toUpperCase()}</Text>
        <View style={s.tierIcon}>
          <Ionicons name={icon} size={20} color={C.gold} />
        </View>
      </View>
      <Text style={s.price}>{formatKes(q.total)}</Text>
      <T style={{ color: C.muted, fontSize: 14 }}>
        {q.eta.replace("-", "–")} • {q.mode}
      </T>
      <View style={{ marginTop: 12, gap: 8 }}>
        {q.bullets.map((x) => (
          <View key={x} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
            <Ionicons name="checkmark-circle-outline" size={18} color={C.gold} />
            <T style={{ flex: 1, fontSize: 14 }}>{x}</T>
          </View>
        ))}
      </View>
      <Button title="Select" onPress={() => onSelect(q.tier)} style={{ marginTop: 14 }} />
    </Card>
  );
}

const s = StyleSheet.create({
  tierLabel: { fontFamily: F.heading, fontSize: 14, letterSpacing: 0.8, color: C.jungle },
  tierIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.mint, alignItems: "center", justifyContent: "center" },
  price: { fontFamily: F.heading, fontSize: 34, color: C.maroon, marginTop: 6 },
  formula: { backgroundColor: "#fff", borderRadius: R.button, padding: 10, marginVertical: 10 },
  formulaText: { fontFamily: F.semi, textAlign: "center", color: C.jungle, fontSize: 14 },
  exRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  exLabel: { fontFamily: F.bodySemi, fontSize: 14, color: C.ink },
  exSum: { fontFamily: F.body, fontSize: 14, color: C.ink },
  guarantee: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.jungle, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  guaranteeText: { fontFamily: F.semi, color: C.gold, fontSize: 14 },
});
