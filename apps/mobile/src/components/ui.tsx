import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F, R, shadow } from "@/theme";

export function H({ style, ...p }: TextProps) {
  return <Text {...p} style={[{ fontFamily: F.heading, color: C.ink, fontSize: 22 }, style]} />;
}
export function T({ style, ...p }: TextProps) {
  return <Text {...p} style={[{ fontFamily: F.body, color: C.ink, fontSize: 15, lineHeight: 21 }, style]} />;
}

type Variant = "maroon" | "jungle" | "gold" | "outline" | "mpesa";
const BG: Record<Variant, string> = { maroon: C.maroon, jungle: C.jungle, gold: C.gold, outline: "#fff", mpesa: "#1F7A3A" };

export function Button({
  title,
  onPress,
  variant = "maroon",
  disabled,
  loading,
  icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = variant === "outline" ? C.maroon : variant === "gold" ? C.jungle : "#fff";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: BG[variant], opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === "outline" && { borderWidth: 1.5, borderColor: C.maroon },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={{ color: fg, fontFamily: F.semi, fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/** Jungle Green screen header with back button (matches Pricing / Checkout references). */
export function Header({ title, subtitle, back = true, right }: { title: string; subtitle?: ReactNode; back?: boolean; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + 10 }]}>
      <View style={s.headerRow}>
        {back ? (
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
        <Text style={s.headerTitle}>{title}</Text>
        <View style={{ width: 28, alignItems: "flex-end" }}>{right}</View>
      </View>
      {subtitle ? <View style={{ alignItems: "center", marginTop: 4 }}>{typeof subtitle === "string" ? <Text style={s.headerSub}>{subtitle}</Text> : subtitle}</View> : null}
    </View>
  );
}

export function EthicalBadge() {
  return (
    <View style={s.badge}>
      <Ionicons name="shield-checkmark" size={14} color={C.gold} />
      <Text style={s.badgeText}>Ethical • Transparent • Fair</Text>
    </View>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: C.gold, borderColor: C.gold }]}>
      {icon && <Ionicons name={icon} size={16} color={active ? C.jungle : C.gold} />}
      <Text style={{ fontFamily: F.bodySemi, color: active ? C.jungle : C.jungle, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { height: 52, borderRadius: R.button, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18 },
  card: { backgroundColor: "#fff", borderRadius: R.card, padding: 16, borderWidth: 1, borderColor: C.border, ...shadow },
  header: { backgroundColor: C.jungle, paddingHorizontal: 16, paddingBottom: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: "#fff", fontFamily: F.heading, fontSize: 24 },
  headerSub: { color: "rgba(255,255,255,0.85)", fontFamily: F.body, fontSize: 14 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "#F3ECDF", borderColor: C.gold, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontFamily: F.semi, fontSize: 12, color: "#6E5630", letterSpacing: 0.6, textTransform: "uppercase" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: C.gold, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#fff" },
});
