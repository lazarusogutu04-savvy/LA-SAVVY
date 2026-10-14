import { StyleSheet } from "react-native";
import { C, F, R } from "@/theme";

export const s = StyleSheet.create({
  wrap: { borderRadius: R.card, overflow: "hidden", borderWidth: 1, borderColor: C.border, backgroundColor: "#EEF0EA" },
  live: { position: "absolute", top: 10, right: 10, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.trafficFree },
  liveText: { fontFamily: F.bodySemi, color: C.trafficFree, fontSize: 12 },
});
