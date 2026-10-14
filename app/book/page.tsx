"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { PaymentMethodKey } from "@/components/brand/payment-icons";
import { Attachments } from "@/components/client/attachments";
import { MarketQuote } from "@/components/client/market-quote";
import { PaymentSelector } from "@/components/client/payment-selector";
import { PriceCard } from "@/components/client/price-card";
import { RoutePlanner, type RouteInfo } from "@/components/client/route-planner";
import { DemoBanner } from "@/components/demo-banner";
import { MasterHeader } from "@/components/master-header";
import { SiteFooter } from "@/components/site-footer";
import { useCustomer } from "@/components/use-customer";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrder, getPaymentConfig, getPricingConfig, uploadOrderFile } from "@/lib/data";
import { calcPrice, DEFAULT_PRICING, zoneFromAddress } from "@/lib/pricing";
import { CATEGORIES, type Category, type PaymentConfig, type PricingConfig } from "@/lib/types";
import { cn, kes } from "@/lib/utils";

const DESCRIPTION_MAX = 500;
const PLACEHOLDERS: Record<string, string> = {
  Delivery: "Be specific: e.g. Delivery - Collect a parcel at Tuskys Rongai and drop it at my gate…",
  Shopping: "Be specific: e.g. Shopping - Buy 2kg sugar, 1L milk, 1 loaf of bread…",
  "Bill Pay": "Be specific: e.g. Bill Pay - Pay KPLC token for meter no. …",
  Pickup: "Be specific: e.g. Pickup - Collect parcel from G4S Rongai, ref no. …",
};
const DEFAULT_PLACEHOLDER = "Be specific: e.g. Shopping - Buy 2kg sugar, 1L milk... Pickup - Collect parcel... Bill Pay - Pay KPLC...";

const METHOD_LABEL: Record<PaymentMethodKey, string> = { mpesa_stk: "M-Pesa", mpesa_paybill: "M-Pesa", paypal: "PayPal", card: "Card" };

const local07 = (e164: string) => (e164.startsWith("+254") ? `0${e164.slice(4)}` : e164);

export default function BookPage() {
  const router = useRouter();
  const { customer, ready } = useCustomer();
  const [category, setCategory] = useState<Category>("Delivery");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [stops, setStops] = useState<string[]>([]);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [isInstant, setIsInstant] = useState(false);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [payConfig, setPayConfig] = useState<PaymentConfig | null>(null);
  const [method, setMethod] = useState<PaymentMethodKey>("mpesa_stk");
  const [details, setDetails] = useState<Record<PaymentMethodKey, string>>({ mpesa_stk: "", mpesa_paybill: "", paypal: "", card: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPricingConfig().then(setPricing).catch(() => undefined);
    getPaymentConfig().then(setPayConfig).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (customer?.phone) setDetails((d) => ({ ...d, mpesa_stk: d.mpesa_stk || local07(customer.phone) }));
  }, [customer]);

  const onRoute = useCallback((r: RouteInfo | null) => setRoute(r), []);
  const filledStops = stops.filter((s) => s.trim());
  const price = useMemo(
    () => (route ? calcPrice({ routeKm: route.routeKm, stopsCount: filledStops.length, trafficLevel: route.trafficLevel, config: pricing }) : null),
    [route, filledStops.length, pricing]
  );
  const displayPrice = price ? (isInstant ? price.instantPrice : price.scheduledPrice) : 0;

  async function pay() {
    setError(null);
    if (!from.trim() || !to.trim()) return setError("Enter where we should go From and To");
    if (!price || !route || price.distanceKm <= 0) return setError("We need the distance to price your errand");
    if (!description.trim()) return setError("Tell us what we should do");
    if (!customer) return;
    try {
      let fileUrls: string[] = [];
      if (files.length) {
        setBusy("Uploading files…");
        fileUrls = await Promise.all(files.map(uploadOrderFile));
      }
      setBusy("Creating your order…");
      const order = await createOrder({
        category,
        from_location: from.trim(),
        to_location: to.trim(),
        stops: filledStops,
        distance_km: price.distanceKm,
        duration_min: route.durationMin,
        traffic_level: route.trafficLevel,
        description: description.trim(),
        file_url: fileUrls[0] ?? null,
        file_urls: fileUrls,
        customer_name: name.trim() || null,
        customer_phone: customer.phone,
        is_instant: isInstant,
        total_price: displayPrice,
        payment_method: method,
        payment_status: "Pending",
        zone: zoneFromAddress(from),
      });

      if (method === "mpesa_stk") {
        setBusy("Sending M-Pesa prompt…");
        await fetch("/api/mpesa/stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, phone: details.mpesa_stk || customer.phone, amount: displayPrice }),
        }).catch(() => undefined);
      }
      router.push(`/track/${order.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  if (!ready)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-jungle" />
      </div>
    );

  return (
    <div className="min-h-screen bg-cream">
      <MasterHeader />
      <DemoBanner />
      <main className="mx-auto max-w-md space-y-5 px-4 py-5">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Errand category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                category === c ? "bg-jungle text-white" : "border border-line bg-white text-jungle hover:border-gold"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {category === "Savvy Market" ? (
          <MarketQuote phone={customer?.phone ?? null} />
        ) : (
          <>
            <section className="space-y-3">
              <div>
                <h1 className="text-xl text-jungle">Where should we run your errand?</h1>
                <p className="text-sm text-muted">Fair prices from Rongai to all Nairobi</p>
              </div>
              <RoutePlanner from={from} to={to} stops={stops} onFrom={setFrom} onTo={setTo} onStops={setStops} onRoute={onRoute} />
            </section>

            {price && route && price.distanceKm > 0 && (
              <PriceCard from={from} to={to} route={route} price={price} isInstant={isInstant} onInstant={setIsInstant} />
            )}

            <section className="space-y-4 rounded-card border border-line bg-white p-4 shadow-soft">
              <div className="space-y-1.5">
                <Label htmlFor="desc">
                  What should we do? <span className="text-maroon">*</span>
                </Label>
                <Textarea
                  id="desc"
                  required
                  maxLength={DESCRIPTION_MAX}
                  className="h-28 resize-none"
                  placeholder={PLACEHOLDERS[category] ?? DEFAULT_PLACEHOLDER}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX))}
                />
                <p className="text-right text-xs text-muted">
                  {description.length}/{DESCRIPTION_MAX}
                </p>
              </div>
              <Attachments files={files} onChange={setFiles} />
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name (optional)</Label>
                <Input id="name" placeholder="So the rider knows who to ask for" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg text-jungle">Payment method</h2>
              <PaymentSelector method={method} onMethod={setMethod} details={details} onDetails={setDetails} config={payConfig} />
            </section>

            <div className="space-y-3 rounded-card border border-line bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Total</span>
                <span className="text-xl font-bold text-[#7A1C1C]">{kes(displayPrice)}</span>
              </div>
              {error && <p className="text-sm font-medium text-maroon">{error}</p>}
              <Button size="lg" className="w-full" onClick={pay} disabled={Boolean(busy)}>
                {busy ? (
                  <>
                    <Loader2 className="animate-spin" /> {busy}
                  </>
                ) : (
                  <>Pay {kes(displayPrice)} - {METHOD_LABEL[method]}</>
                )}
              </Button>
              <p className="text-center text-[11px] text-muted">You&apos;ll be taken to live tracking right after booking.</p>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
