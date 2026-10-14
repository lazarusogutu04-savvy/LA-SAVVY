import { Image } from "expo-image";

/** Exact supplied master logo artwork — never redrawn (S with curl hook, maroon half-circle, LA monogram, no crowns). */
export function LogoMark({ size = 40, radius = 10 }: { size?: number; radius?: number }) {
  return <Image source={require("../../assets/brand/logo-mark.png")} style={{ width: size, height: size, borderRadius: radius }} contentFit="cover" accessibilityLabel="LA & Savvy Limited" />;
}
