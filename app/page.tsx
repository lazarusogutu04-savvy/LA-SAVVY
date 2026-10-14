"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogoFull } from "@/components/brand/logo";
import { getCustomer } from "@/lib/auth";
import { company } from "@/lib/config";

/** Splash screen with logo → /book when signed in, otherwise /auth. */
export default function Splash() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(async () => {
      const c = await getCustomer();
      router.replace(c ? "/book" : "/auth");
    }, 1600);
    return () => clearTimeout(t);
  }, [router]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-jungle px-6 text-center text-white">
      <LogoFull width={200} className="animate-pulse shadow-2xl" />
      <div>
        <h1 className="font-heading text-2xl text-gold">Mtaani Errands</h1>
        <p className="mt-1 text-sm text-white/80">{company.tagline}</p>
      </div>
      <p className="text-xs text-white/60">{company.base}</p>
    </main>
  );
}
