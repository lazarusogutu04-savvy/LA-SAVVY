import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.maroon,
        tabBarInactiveTintColor: "#8A8A8A",
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: C.border },
        tabBarLabelStyle: { fontFamily: F.semi, fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Errands", tabBarIcon: ({ color, size }) => <Ionicons name="bicycle" color={color} size={size} /> }} />
      <Tabs.Screen name="market" options={{ title: "Savvy Market", tabBarIcon: ({ color, size }) => <Ionicons name="storefront" color={color} size={size} /> }} />
    </Tabs>
  );
}
