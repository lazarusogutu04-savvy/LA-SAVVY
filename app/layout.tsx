import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-poppins", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Mtaani Errands • LA & Savvy Limited", template: "%s • Mtaani Errands" },
  description: "Fair, Transparent, Ethical pricing - No surge. Errands & delivery from Rongai to all Nairobi. By LA & Savvy Limited.",
  metadataBase: new URL("https://la-savvy.vercel.app"),
};

export const viewport: Viewport = { themeColor: "#0F3D2E", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-cream">{children}</body>
    </html>
  );
}
