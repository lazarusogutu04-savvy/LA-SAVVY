"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import { formatKes, PAYMENT_PLACEHOLDER, type PaymentMethodKey, type TierQuote } from "@shared";
import { PaymentIcon } from "@/components/brand/payment-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PublicMethod {
  key: PaymentMethodKey;
  label: string;
  fieldLabel: string;
  value: string;
  configured: boolean;
}

const SUBTITLE: Record<PaymentMethodKey, (v: string) => string> = {
  mpesa_stk: () => "Send payment prompt to your phone",
  mpesa_paybill: (v) => `Pay to Business Number ${v}`,
  paypal: (v) => (v === PAYMENT_PLACEHOLDER ? `PayPal: ${v}` : "Pay with PayPal account"),
  card: (v) => (v === PAYMENT_PLACEHOLDER ? `Card: ${v}` : "Credit or Debit Card"),
};

export function Checkout() {
  const sp = useSearchParams();
  const tier = sp.get("tier") === "instant" ? "instant" : "scheduled";
  const km = Number(sp.get("km") ?? 22);
  const traffic = Number(sp.get("t") ?? 0);
  const fromLabel = sp.get("from") ?? "";
  const toLabel = sp.get("to") ?? "";

  const [quote, setQuote] = useState<TierQuote | null>(null);
  const [methods, setMethods] = useState<PublicMethod[] | null>(null);
  const [method, setMethod] = useState<PaymentMethodKey | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ code: string; total: number; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/public/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((c) => {
        setMethods(c.payments.methods);
        setMethod(c.payments.methods[0]?.key ?? null);
      });
    fetch("/api/public/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ distanceKm: km, trafficDelayMin: traffic }) })
      .then((r) => r.json())
      .then((q) => setQuote(q[tier]));
  }, [km, traffic, tier]);

  const pay = async () => {
    if (!method || !quote) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distanceKm: km, trafficDelayMin: traffic, tier, customerName: name, customerPhone: phone, paymentMethod: method, fromLabel, toLabel, category: sp.get("cat") }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      let message = "Your order is confirmed. A rider will be assigned shortly.";
      if (method === "mpesa_stk") {
        const s = await fetch("/api/payments/mpesa/stk-push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: j.order.id, phone }) });
        const sj = await s.json();
        if (!s.ok) throw new Error(sj.error);
        message = sj.message ?? "Check your phone and enter your M-Pesa PIN.";
      }
      setDone({ code: j.order.code, total: j.order.totalKes, message });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-card border border-line bg-white p-6 text-center shadow-soft">
        <CheckCircle2 className="mx-auto h-16 w-16 text-[#2E9D4F]" />
        <h1 className="mt-3 text-2xl">Order placed</h1>
        <p className="mt-1 text-sm text-muted">{done.message}</p>
        <dl className="mt-5 space-y-3 rounded-card bg-cream p-4 text-left text-sm">
          <div className="flex justify-between"><dt>Order ID</dt><dd className="font-semibold">{done.code}</dd></div>
          <div className="flex justify-between"><dt>Total</dt><dd className="font-heading text-xl font-bold text-maroon">{formatKes(done.total)}</dd></div>
        </dl>
        <Button asChild variant="outline" className="mt-5 w-full"><Link href="/">Back to Home</Link></Button>
      </div>
    );
  }

  const valid = phone.replace(/\D/g, "").length >= 9;

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-card bg-white shadow-soft">
      <div className="relative bg-jungle px-5 pb-8 pt-6 text-center text-white">
        <Link href="/book" className="absolute left-4 top-6 rounded-full p-1 hover:bg-white/10" aria-label="Back"><ArrowLeft className="h-6 w-6" /></Link>
        <h1 className="text-[26px]">Checkout</h1>
        <p className="mt-1 text-sm text-white/85">
          Payment Method • <b>{quote ? formatKes(quote.total) : "…"}</b>
        </p>
      </div>
      <div className="-mt-4 space-y-3 rounded-t-[22px] bg-white px-4 pb-6 pt-5">
        <h2 className="text-xl">Select Payment Method</h2>
        {!methods && <Loader2 className="mx-auto h-6 w-6 animate-spin text-jungle" />}
        {methods?.length === 0 && <p className="text-sm text-muted">Payment methods: {PAYMENT_PLACEHOLDER}</p>}
        {methods?.map((m) => {
          const active = m.key === method;
          return (
            <div key={m.key}>
              <button
                type="button"
                onClick={() => setMethod(m.key)}
                className={cn("flex w-full items-center gap-3 rounded-card border-2 bg-white p-3.5 text-left shadow-sm", active ? "border-[#2E9D4F]" : "border-line")}
              >
                <PaymentIcon method={m.key} />
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-[16px] font-semibold">{m.label}</span>
                  <span className={cn("block text-sm", active ? "text-[#2E9D4F]" : "text-muted")}>{SUBTITLE[m.key](m.value)}</span>
                </span>
                {active && <CheckCircle2 className="h-7 w-7 fill-[#2E9D4F] text-white" />}
              </button>
              {active && m.key === "mpesa_stk" && (
                <div className="mt-2 rounded-card bg-[#BFDDBF]/60 p-4">
                  <p className="font-heading text-lg font-semibold text-jungle">M-Pesa STK Push</p>
                  <p className="text-sm text-ink/80">Enter your M-Pesa phone number to receive payment prompt</p>
                  <div className="relative mt-3">
                    <span className="absolute left-3 top-3 text-base" aria-hidden>🇰🇪</span>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="0712 345 678" aria-label="M-Pesa phone number" className="bg-white/80 pl-10" />
                  </div>
                </div>
              )}
              {active && m.key !== "mpesa_stk" && !m.configured && (
                <p className="mt-2 rounded-btn bg-gold-100 px-3 py-2 text-xs text-[#6E5630]">
                  {m.fieldLabel}: {PAYMENT_PLACEHOLDER}. You can still place the order — we&apos;ll share payment details on WhatsApp.
                </p>
              )}
            </div>
          );
        })}

        <div className="grid gap-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Wanjiku" />
          </div>
          {method !== "mpesa_stk" && <div className="space-y-1.5">
            <Label htmlFor="phone">Mobile number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="0712 345 678" />
          </div>}
        </div>

        <div className="flex items-center justify-between rounded-card bg-cream px-4 py-3">
          <span className="font-semibold">Total</span>
          <span className="font-heading text-2xl font-bold text-maroon">{quote ? formatKes(quote.total) : "…"}</span>
        </div>
        <p className="flex items-start gap-2 text-xs text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-jungle" /> Ethical pricing: transparent formula, no surge pricing, all prices inclusive.
        </p>
        {error && <p className="text-sm font-medium text-maroon">{error}</p>}
        <Button size="lg" className={cn("w-full", method === "mpesa_stk" && "bg-[#1F7A3A] hover:bg-[#1A6A32]")} disabled={!valid || busy || !quote || !method} onClick={pay}>
          {busy ? <Loader2 className="animate-spin" /> : <Lock />} {method === "mpesa_stk" ? "Send STK Push" : "Place Order"}
        </Button>
        <p className="pt-1 text-center text-xs text-muted">🔒 Secure &amp; encrypted payments • Powered by Mtaani Errands</p>
      </div>
    </div>
  );
}
