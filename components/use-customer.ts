"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCustomer, type Customer } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/** Requires a signed-in customer; redirects to /auth otherwise. */
export function useCustomer() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    getCustomer().then((c) => {
      if (!alive) return;
      if (!c) {
        router.replace(`/auth?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setCustomer(c);
      setReady(true);
    });
    const sub = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/auth");
    });
    return () => {
      alive = false;
      sub?.data.subscription.unsubscribe();
    };
  }, [router]);
  return { customer, ready };
}
