import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { RouteEstimate, Tier } from "@shared";
import type { Formula, Quotes } from "./api";

interface Booking {
  category: string;
  route: RouteEstimate | null;
  quotes: Quotes | null;
  formula: Formula | null;
  estimate: boolean;
  tier: Tier | null;
  phone: string;
  name: string;
}

const Ctx = createContext<{ b: Booking; set: (p: Partial<Booking>) => void } | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [b, setB] = useState<Booking>({ category: "Delivery", route: null, quotes: null, formula: null, estimate: false, tier: null, phone: "", name: "" });
  const value = useMemo(() => ({ b, set: (p: Partial<Booking>) => setB((x) => ({ ...x, ...p })) }), [b]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBooking() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useBooking outside BookingProvider");
  return c;
}
