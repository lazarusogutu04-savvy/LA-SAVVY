import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatKes } from "@shared";
import { TrafficMap } from "@/components/TrafficMap";
import { Button, Card, H, Header, T } from "@/components/ui";
import { useBooking } from "@/lib/booking";
import { C, F } from "@/theme";

export default function Success() {
  const { code = "", total = "0", message = "", method } = useLocalSearchParams<{ code: string; total: string; message: string; method: string }>();
  const { b } = useBooking();
  return (
    <View style={{ flex: 1 }}>
      <Header title="Mtaani Errands" back={false} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <View style={{ alignItems: "center", gap: 6, marginTop: 8 }}>
          <View style={s.check}>
            <Ionicons name="checkmark" size={42} color="#fff" />
          </View>
          <H style={{ fontSize: 26, marginTop: 8 }}>{method === "mpesa_stk" ? "Check your phone" : "Order placed"}</H>
          <T style={{ textAlign: "center", color: C.muted }}>{message}</T>
        </View>
        <Card style={{ gap: 12 }}>
          <Row label="Order ID" value={code} />
          <Row label="Total" value={formatKes(Number(total))} maroon />
          <Row label="Delivery to" value={b.route?.toLabel.split(",")[0] ?? "—"} />
          <Row label="Service" value={b.tier === "instant" ? "Instant Premium" : "Scheduled Standard"} />
        </Card>
        {b.route && <TrafficMap route={b.route} height={170} />}
        <Button title="Back to Home" variant="outline" onPress={() => router.replace("/(tabs)")} />
        <T style={{ textAlign: "center", fontSize: 12, color: C.muted }}>We&apos;ll send rider details by SMS / WhatsApp once assigned.</T>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, maroon }: { label: string; value: string; maroon?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <T style={{ color: C.muted }}>{label}</T>
      <Text style={{ fontFamily: F.heading, fontSize: maroon ? 24 : 16, color: maroon ? C.maroon : C.ink }}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  check: { width: 76, height: 76, borderRadius: 22, backgroundColor: C.trafficFree, alignItems: "center", justifyContent: "center" },
});
