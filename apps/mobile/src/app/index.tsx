import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { company } from "@shared";
import { LogoMark } from "@/components/Logo";
import { signedInPhone } from "@/lib/auth";
import { C, F } from "@/theme";

/** Splash: Jungle Green, exact master logo, LA & SAVVY LIMITED in gold, Mtaani Errands subtitle. */
export default function Splash() {
  useEffect(() => {
    const t = setTimeout(async () => router.replace((await signedInPhone()) ? "/(tabs)" : "/login"), 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={s.root}>
      <LogoMark size={190} radius={0} />
      <Text style={s.name}>LA & SAVVY LIMITED</Text>
      <Text style={s.sub}>Mtaani Errands</Text>
      <Text style={s.foot}>{company.base}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.jungle, alignItems: "center", justifyContent: "center", padding: 24 },
  name: { fontFamily: F.heading, color: C.gold, fontSize: 26, letterSpacing: 1.5, marginTop: 18 },
  sub: { fontFamily: F.semi, color: "#fff", fontSize: 17, marginTop: 6, opacity: 0.9 },
  foot: { position: "absolute", bottom: 48, fontFamily: F.body, color: "rgba(255,255,255,0.6)", fontSize: 12 },
});
