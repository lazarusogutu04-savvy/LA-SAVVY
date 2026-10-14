import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        jungle: { DEFAULT: "#0F3D2E", 600: "#145040", 700: "#0B2F23", 900: "#07201A" },
        maroon: { DEFAULT: "#7A1C1C", 600: "#8E2424", 700: "#651616", 50: "#F7ECEC" },
        gold: { DEFAULT: "#C4A77D", 600: "#B0915F", 100: "#F3ECDF" },
        cream: "#FFFEF8",
        mint: "#E8F5E9",
        line: "#E7E2D6",
        ink: "#1B1B1B",
        muted: "#6B6B6B",
        traffic: { free: "#2E9D4F", slow: "#F2B33D", heavy: "#D93A2B" },
        border: "#E7E2D6",
        ring: "#C4A77D",
        background: "#FFFEF8",
        foreground: "#1B1B1B",
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "16px", btn: "12px" },
      boxShadow: {
        soft: "0 6px 24px -10px rgba(15, 61, 46, 0.18), 0 2px 6px -2px rgba(15, 61, 46, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
