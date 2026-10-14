import type { ExpoConfig } from "expo/config";

const placeholder = (v?: string) => (v && v !== "Will be provided later" ? v : undefined);
const mapsKey = placeholder(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);

const config: ExpoConfig = {
  name: "Mtaani Errands",
  slug: "mtaani-errands",
  scheme: "mtaani",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  backgroundColor: "#FFFEF8",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "ke.co.lasavvy.mtaani",
    ...(mapsKey ? { config: { googleMapsApiKey: mapsKey } } : {}),
  },
  android: {
    package: "ke.co.lasavvy.mtaani",
    adaptiveIcon: { backgroundColor: "#0F3D2E", foregroundImage: "./assets/adaptive-icon.png" },
    ...(mapsKey ? { config: { googleMaps: { apiKey: mapsKey } } } : {}),
  },
  web: { favicon: "./assets/favicon.png", bundler: "metro" },
  plugins: [
    "expo-router",
    ["expo-splash-screen", { backgroundColor: "#0F3D2E", image: "./assets/splash-icon.png", imageWidth: 200 }],
    "expo-font",
    "expo-image",
    ["expo-image-picker", { photosPermission: "Attach a photo of your shopping list so we shop accurately." }],
  ],
  experiments: { typedRoutes: false },
};

export default config;
