import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, H, Header, T } from "@/components/ui";
import { sendOtp, verifyOtp } from "@/lib/auth";
import { C, F, R } from "@/theme";

export default function Otp() {
  const { phone = "" } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<TextInput>(null);

  useEffect(() => {
    const t = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const verify = async (c = code) => {
    setBusy(true);
    setError("");
    try {
      await verifyOtp(phone, c);
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const masked = phone.replace(/^(\+254\d{3})\d{3}(\d{3})$/, "$1 ***$2");
  return (
    <View style={{ flex: 1 }}>
      <Header title="Verify" />
      <View style={{ padding: 20 }}>
        <Card>
          <H style={{ color: C.jungle }}>OTP Authentication</H>
          <T style={{ color: C.muted, marginTop: 4 }}>Enter the 6-digit code sent to {masked}</T>
          <Pressable onPress={() => input.current?.focus()} style={s.row}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[s.box, i === code.length && s.boxActive]}>
                <Text style={s.digit}>{code[i] ?? ""}</Text>
              </View>
            ))}
          </Pressable>
          <TextInput
            ref={input}
            value={code}
            onChangeText={(v) => {
              const c = v.replace(/\D/g, "").slice(0, 6);
              setCode(c);
              if (c.length === 6) verify(c);
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            autoFocus
            maxLength={6}
            style={s.hidden}
          />
          <Pressable disabled={left > 0} onPress={() => { sendOtp(phone); setLeft(30); }}>
            <Text style={s.resend}>{left > 0 ? `Resend code in ${left}s` : "Resend code"}</Text>
          </Pressable>
          {!!error && <T style={{ color: C.maroon, textAlign: "center", marginTop: 8 }}>{error}</T>}
          <Button title="Verify & continue" onPress={() => verify()} disabled={code.length !== 6} loading={busy} style={{ marginTop: 16 }} />
        </Card>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  box: { width: 46, height: 54, borderRadius: R.button, borderWidth: 1.5, borderColor: C.border, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  boxActive: { borderColor: C.maroon },
  digit: { fontFamily: F.heading, fontSize: 22, color: C.ink },
  hidden: { position: "absolute", opacity: 0, height: 1, width: 1 },
  resend: { textAlign: "center", color: C.maroon, fontFamily: F.bodySemi, marginTop: 16, textDecorationLine: "underline" },
});
