"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, PackageSearch } from "lucide-react";
import { DemoBanner } from "@/components/demo-banner";
import { MasterHeader } from "@/components/master-header";
import { SiteFooter } from "@/components/site-footer";
import { useCustomer } from "@/components/use-customer";
import { Button } from "@/components/ui/button";
import { listMyOrders } from "@/lib/data";
import type { Order } from "@/lib/types";
import { formatDate, kes, shortId } from "@/lib/utils";

export default function MyOrders() {
  const { customer, ready } = useCustomer();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    listMyOrders(customer?.phone ?? null)
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, [ready, customer]);

  return (
    <div className="min-h-screen bg-cream">
      <MasterHeader />
      <DemoBanner />
      <main className="mx-auto max-w-md space-y-4 px-4 py-5">
        <h1 className="text-xl text-jungle">Track your errands</h1>
        {error && <p className="text-sm text-maroon">{error}</p>}
        {!orders && !error && <Loader2 className="mx-auto h-6 w-6 animate-spin text-jungle" />}
        {orders?.length === 0 && (
          <div className="rounded-card border border-line bg-white p-6 text-center shadow-soft">
            <PackageSearch className="mx-auto h-10 w-10 text-gold-600" />
            <p className="mt-2 font-semibold text-jungle">No orders yet</p>
            <Button asChild className="mt-4">
              <Link href="/book">Book an errand</Link>
            </Button>
          </div>
        )}
        {orders?.map((o) => (
          <Link key={o.id} href={`/track/${o.id}`} className="flex items-center gap-3 rounded-card border border-line bg-white p-4 shadow-soft hover:border-gold">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">
                #{shortId(o.id)} • {formatDate(o.created_at)}
              </p>
              <p className="truncate font-semibold text-jungle">
                {o.from_location.split(",")[0]} → {o.to_location.split(",")[0]}
              </p>
              <span className="mt-1 inline-block rounded-full bg-mint px-2 py-0.5 text-[11px] font-semibold text-jungle">{o.status}</span>
            </div>
            <span className="font-bold text-maroon">{kes(o.total_price)}</span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
