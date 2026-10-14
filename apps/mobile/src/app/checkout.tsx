import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatKes, PAYMENT_PLACEHOLDER, type PaymentMethodKey } from "@shared";
import { PaymentIcon } from "@/components/PaymentIcon";
import { Button, Header, T } from "@/components/ui";
import { fetchPaymentMethods, placeOrder, type PublicMethod } from "@/lib/api";
import { useBooking } from "@/lib/booking";
import { C, F, R, shadow } from "@/theme";

const SUB: Record<PaymentMethodKey, (v: string) => string> = {
  mpesa_stk: () => "Send payment prompt to your phone",
  mpesa_paybill: (v) => `Pay to Business Number ${v}`,
  paypal: (v) => (v === PAYMENT_PLACEHOLDER ? `PayPal: ${v}` : "Pay with PayPal account"),
  card: (v) => (v === PAYMENT_PLACEHOLDER ? `Card: ${v}` : "Credit or Debit Card"),
};

export default function Checkout() {
  const { b } = useBooking();
  const [methods, setMethods] = useState<PublicMethod[] | null>(null);
  const [method, setMethod] = useState<PaymentMethodKey | null>(null);
  const [phone, setPhone] = useState(b.phone.replace(/^\+254/, "0"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPaymentMethods().then((m) => {
      setMethods(m);
      setMethod(m[0]?.key ?? null);
    });
  }, []);

  if (!b.route || !b.quotes || !b.tier) return <Redirect href="/pricing" />;
  const quote = b.quotes[b.tier];

  const pay = async () => {
    if (!method) return;
    setBusy(true);
    setError("");
    try {
      const o = await placeOrder({ route: b.route!, tier: b.tier!, category: b.category, customerName: b.name, customerPhone: phone, paymentMethod: method });
      router.replace({ pathname: "/success", params: { code: o.code, total: String(o.totalKes), message: o.message, method } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header
        title="Checkout"
        subtitle={
          <Text style={{ color: "rgba(255,255,255,0.85)", fontFamily: F.body }}>
            Payment Method • <Text style={{ fontFamily: F.heading, color: "#fff" }}>{formatKes(quote.total)}</Text>
          </Text>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={s.h}>Select Payment Method</Text>
        {!methods && <ActivityIndicator color={C.jungle} />}
        {methods?.length === 0 && <T>Payment methods: {PAYMENT_PLACEHOLDER}</T>}
        {methods?.map((m) => {
          const active = m.key === method;
          return (
            <View key={m.key} style={{ gap: 8 }}>
              <Pressable onPress={() => setMethod(m.key)} style={[s.method, active && s.methodActive]} accessibilityRole="radio" accessibilityState={{ selected: active }}>
                <PaymentIcon method={m.key} />
                <View style={{ flex: 1 }}>
                  <Text style={s.mTitle}>{m.label}</Text>
                  <Text style={[s.mSub, active && { color: C.trafficFree }]}>{SUB[m.key](m.value)}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={28} color={C.trafficFree} />}
              </Pressable>
              {active && m.key === "mpesa_stk" && (
                <View style={s.stk}>
                  <Text style={s.stkTitle}>M-Pesa STK Push</Text>
                  <T style={{ fontSize: 14, color: "#2F3B33" }}>Enter your M-Pesa phone number to receive payment prompt</T>
                  <View style={s.phone}>
                    <Text style={{ fontSize: 18 }}>🇰🇪</Text>
                    <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0712 345 678" placeholderTextColor="#8A8A8A" style={s.phoneInput} />
                  </View>
                </View>
              )}
              {active && m.key !== "mpesa_stk" && !m.configured && (
                <View style={s.pending}>
                  <T style={{ fontSize: 13, color: "#6E5630" }}>
                    {m.fieldLabel}: {PAYMENT_PLACEHOLDER}. You can still place the order — we&apos;ll share payment details on WhatsApp.
                  </T>
                </View>
              )}
            </View>
          );
        })}

        {method !== "mpesa_stk" && (
          <View style={s.phone}>
            <Ionicons name="call-outline" size={18} color={C.jungle} />
            <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Your phone number" placeholderTextColor="#8A8A8A" style={s.phoneInput} />
          </View>
        )}

        <View style={s.total}>
          <Text style={{ fontFamily: F.semi, fontSize: 16, color: C.ink }}>Total</Text>
          <Text style={{ fontFamily: F.heading, fontSize: 28, color: C.maroon }}>{formatKes(quote.total)}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
          <Ionicons name="shield-checkmark-outline" size={18} color={C.jungle} />
          <T style={{ flex: 1, fontSize: 13, color: C.muted }}>
            Ethical pricing: {quote.label} via one transparent formula. No surge pricing. All prices inclusive.
          </T>
        </View>
        {!!error && <T style={{ color: C.maroon }}>{error}</T>}
        <Button
          title={method === "mpesa_stk" ? "Send STK Push" : "Place Order"}
          variant={method === "mpesa_stk" ? "mpesa" : "maroon"}
          icon="lock-closed"
          onPress={pay}
          loading={busy}
          disabled={!method || phone.replace(/\D/g, "").length < 9}
        />
        <T style={{ textAlign: "center", fontSize: 12, color: C.muted }}>🔒 Secure & encrypted payments • Powered by Mtaani Errands</T>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  h: { fontFamily: F.heading, fontSize: 21, color: C.ink },
  method: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: R.card, borderWidth: 2, borderColor: C.border, padding: 14, ...shadow },
  methodActive: { borderColor: C.trafficFree },
  mTitle: { fontFamily: F.semi, fontSize: 16, color: C.ink },
  mSub: { fontFamily: F.body, fontSize: 14, color: C.muted, marginTop: 2 },
  stk: { backgroundColor: "#CFE5CF", borderRadius: R.card, padding: 16, gap: 8 },
  stkTitle: { fontFamily: F.heading, fontSize: 19, color: C.jungle },
  phone: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F2F4EE", borderRadius: R.button, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: C.border },
  phoneInput: { flex: 1, fontFamily: F.body, fontSize: 17, color: C.ink },
  pending: { backgroundColor: "#F3ECDF", borderRadius: R.button, padding: 10 },
  total: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: R.card, padding: 16, borderWidth: 1, borderColor: C.border },
});
