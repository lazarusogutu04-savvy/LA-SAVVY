import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { company } from "@shared";
import { LogoMark } from "@/components/Logo";
import { Button, Card, H, T } from "@/components/ui";
import { authDemo, sendOtp, toE164 } from "@/lib/auth";
import { useBooking } from "@/lib/booking";
import { C, F, R } from "@/theme";

export default function Login() {
  const insets = useSafeAreaInsets();
  const { set } = useBooking();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const digits = phone.replace(/\D/g, "");
  const valid = /^(0?[17]\d{8}|254[17]\d{8})$/.test(digits);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const e164 = toE164(phone);
      await sendOtp(e164);
      set({ phone: e164, name });
      router.push({ pathname: "/otp", params: { phone: e164 } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.jungle }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 40, padding: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <LogoMark size={96} radius={16} />
          <Text style={s.brand}>LA & SAVVY LIMITED</Text>
          <Text style={s.sub}>Mtaani Errands</Text>
        </View>
        <Card>
          <View style={s.icon}>
            <Ionicons name="person" size={22} color="#fff" />
          </View>
          <H style={{ textAlign: "center", color: C.jungle }}>Sign in to continue</H>
          <T style={{ textAlign: "center", color: C.muted, marginTop: 4 }}>We&apos;ll text you a 6-digit code</T>

          <Text style={s.label}>Full name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Jane Wanjiku" placeholderTextColor="#8A8A8A" style={s.input} autoComplete="name" />

          <Text style={s.label}>Mobile number</Text>
          <View style={[s.input, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
            <View style={s.prefix}>
              <Text style={{ fontFamily: F.bodySemi, color: C.ink }}>🇰🇪 +254</Text>
            </View>
            <TextInput value={phone} onChangeText={setPhone} placeholder="7XX XXX XXX" placeholderTextColor="#8A8A8A" keyboardType="phone-pad" style={{ flex: 1, fontFamily: F.body, fontSize: 16, color: C.ink }} autoComplete="tel" maxLength={13} />
          </View>
          {!!error && <T style={{ color: C.maroon, marginTop: 8 }}>{error}</T>}
          <Button title="Send code" onPress={submit} disabled={!valid} loading={busy} style={{ marginTop: 18 }} />
          {authDemo && <T style={{ color: "#6E5630", fontSize: 12, marginTop: 10, textAlign: "center" }}>Demo mode: any 6-digit code works until Supabase is connected.</T>}
          <T style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 12 }}>By continuing you agree to our Terms of Service & Privacy Policy</T>
        </Card>
        <Text style={s.foot}>{company.footer}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  brand: { fontFamily: F.heading, color: C.gold, fontSize: 20, letterSpacing: 1.2, marginTop: 12 },
  sub: { fontFamily: F.semi, color: "rgba(255,255,255,0.85)", fontSize: 14 },
  icon: { alignSelf: "center", width: 44, height: 44, borderRadius: 12, backgroundColor: C.maroon, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  label: { fontFamily: F.bodySemi, fontSize: 14, color: C.ink, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.border, backgroundColor: "#F7F5F0", borderRadius: R.button, paddingHorizontal: 12, height: 50, fontFamily: F.body, fontSize: 16, color: C.ink },
  prefix: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#fff" },
  foot: { textAlign: "center", color: "rgba(255,255,255,0.6)", fontFamily: F.body, fontSize: 12, marginTop: 24 },
});
