/** LA & Savvy Limited — locked brand tokens. Do not change without brand approval. */
export const brand = {
  colors: {
    jungle: "#0F3D2E", // Primary: headers, nav, splash
    maroon: "#7A1C1C", // CTA: buttons, total price, badges
    gold: "#C4A77D", // Accent: logo, icons, highlights
    cream: "#FFFEF8", // Content background
    mint: "#E8F5E9", // Cards, highlights
    ink: "#1B1B1B",
    muted: "#6B6B6B",
    border: "#E7E2D6",
    trafficFree: "#2E9D4F",
    trafficSlow: "#F2B33D",
    trafficHeavy: "#D93A2B",
  },
  radius: { card: 16, button: 12 },
  fonts: { heading: "Poppins_700Bold", body: "Inter_400Regular" },
} as const;

export const company = {
  name: "LA & Savvy Limited",
  product: "Mtaani Errands",
  base: "Rongai, Nairobi, Kenya",
  email: "hello@lasavvy.co.ke",
  website: "https://www.lasavvy.co.ke",
  footer: "© 2025 LA & Savvy Limited • Rongai, Nairobi, Kenya",
} as const;

/** Shown in every payment field until the Main Admin configures it. */
export const PAYMENT_PLACEHOLDER = "Will be provided later";

export const ZONES = ["Rongai", "Kiserian", "CBD", "Kitengela", "Nairobi Wide"] as const;
export const AGENT_ROLES = ["Errand Agent", "Delivery Guy", "Supplier"] as const;
export const ERRAND_CATEGORIES = ["Delivery", "Shopping", "Bill Pay", "Pickup", "Tours", "BnB"] as const;
export const ORDER_STATUSES = ["Pending", "Assigned", "In Transit", "Delivered"] as const;
