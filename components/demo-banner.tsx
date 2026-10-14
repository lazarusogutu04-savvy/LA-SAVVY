"use client";
import { demoMode } from "@/lib/supabase";

export function DemoBanner() {
  if (!demoMode) return null;
  return (
    <p className="bg-gold-100 px-4 py-1.5 text-center text-[11px] font-medium text-[#6E5630]">
      Demo mode • Supabase keys will be provided later — data is saved on this device only
    </p>
  );
}
