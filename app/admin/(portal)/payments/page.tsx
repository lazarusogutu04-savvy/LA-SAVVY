"use client";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { AdminBanner } from "@/components/admin/admin-banner";
import { PaymentIcon, type PaymentMethodKey } from "@/components/brand/payment-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PLACEHOLDER } from "@/lib/config";
import { getPaymentConfig, savePaymentConfig } from "@/lib/data";
import type { PaymentConfig } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const CARDS: { icon: PaymentMethodKey; title: string; sub: string; enabled: keyof PaymentConfig; field: keyof PaymentConfig; label: string }[] = [
  { icon: "mpesa_stk", title: "M-Pesa STK Push", sub: "Prompt on customer's phone (Daraja)", enabled: "mpesa_stk_enabled", field: "mpesa_stk_key", label: "Shortcode / Till" },
  { icon: "mpesa_paybill", title: "Paybill Number", sub: "Customers pay via M-Pesa menu", enabled: "paybill_enabled", field: "paybill_number", label: "Paybill number" },
  { icon: "paypal", title: "PayPal", sub: "International customers", enabled: "paypal_enabled", field: "paypal_id", label: "PayPal ID / email" },
  { icon: "card", title: "Card", sub: "Visa / Mastercard", enabled: "card_enabled", field: "card_key", label: "Card provider public key" },
];

export default function PaymentConfigPage() {
  const [cfg, setCfg] = useState<PaymentConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getPaymentConfig().then(setCfg);
  }, []);

  if (!cfg) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-jungle" />;

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      setCfg(await savePaymentConfig(cfg!));
      setMsg("Changes saved");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminBanner title="Payment Config" subtitle="Turn methods on and add details as they are issued" />
      <div className="grid gap-3 md:grid-cols-2">
        {CARDS.map((c) => {
          const on = Boolean(cfg[c.enabled]);
          return (
            <div key={c.title} className={cn("rounded-card border-2 bg-white p-4 shadow-soft", on ? "border-maroon" : "border-line")}>
              <div className="flex items-center gap-3">
                <PaymentIcon method={c.icon} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{c.title}</p>
                  <p className="text-xs text-muted">{c.sub}</p>
                </div>
                <Switch checked={on} onCheckedChange={(v) => setCfg({ ...cfg, [c.enabled]: v })} aria-label={`${c.title} enabled`} />
              </div>
              <label className="mt-3 block text-xs font-semibold text-muted">
                {c.label}
                <Input
                  className="mt-1"
                  placeholder={PLACEHOLDER}
                  value={(cfg[c.field] as string | null) ?? ""}
                  onChange={(e) => setCfg({ ...cfg, [c.field]: e.target.value || null })}
                />
              </label>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        Secret Daraja keys (consumer key/secret, passkey) belong in Vercel environment variables, not here. Until they are set, customers see the manual Till.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={busy} className="bg-[#7A1C1C]">
          {busy ? <Loader2 className="animate-spin" /> : <Save />} Save Changes
        </Button>
        <span className="text-sm text-muted">Last saved: {formatDate(cfg.last_saved)}</span>
        {msg && <span className="text-sm font-semibold text-jungle">{msg}</span>}
      </div>
    </div>
  );
}
