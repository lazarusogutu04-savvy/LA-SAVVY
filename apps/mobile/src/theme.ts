import { brand } from "@shared";

export const C = brand.colors;
export const R = brand.radius;

export const F = {
  heading: "Poppins_700Bold",
  semi: "Poppins_600SemiBold",
  body: "Inter_400Regular",
  bodySemi: "Inter_600SemiBold",
} as const;

export const shadow = {
  shadowColor: "#0F3D2E",
  shadowOpacity: 0.12,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;
