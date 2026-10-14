"use client";
import { useState, useTransition } from "react";
import { Check, Info, Lock, Package, Settings } from "lucide-react";
import { PAYMENT_PLACEHOLDER, type PaymentConfig, type PaymentMethodConfig } from "@shared";
import { PaymentIcon } from "@/components/brand/payment-icons";
import { AdminModeBanner } from "@/components/admin/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn, timeAgo } from "@/lib/utils";
import { savePayments } from "../actions";

export function PaymentConfigForm({ initial }: { initial: PaymentConfig }) {
  const [methods, setMethods] = useState<PaymentMethodConfig[]>(initial.methods);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [dirty, setDirty] = useState(false);
  const [flash, setFlash] = useState(false);
  const [pending, start] = useTransition();

  const patch = (key: PaymentMethodConfig["key"], p: Partial<PaymentMethodConfig>) => {
    setMethods((ms) => ms.map((m) => (m.key === key ? { ...m, ...p } : m)));
    setDirty(true);
  };

  const save = () =>
    start(async () => {
      const saved = await savePayments(methods);
      setMethods(saved.methods);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setFlash(true);
      setTimeout(() => setFlash(false), 2500);
    });

  return (
    <div className="mx-auto max-w-2xl">
      <AdminModeBanner>Admin mode active • Main Admin can edit &amp; save payment methods</AdminModeBanner>

      <div className="overflow-hidden rounded-card bg-[#F6F4EF] shadow-soft">
        <div className="relative bg-maroon px-14 pb-10 pt-7 text-center text-white">
          <Settings className="absolute left-5 top-8 h-7 w-7 text-white/90" aria-hidden />
          <h1 className="text-[22px] leading-tight sm:text-[26px]">Payment Configuration</h1>
          <p className="mt-1 text-sm text-white/85">Manage payment methods for Mtaani Errands</p>
        </div>

        <div className="-mt-5 space-y-3 rounded-t-[22px] bg-[#F6F4EF] px-4 pb-6 pt-5 sm:px-6">
          {methods.map((m) => (
            <div key={m.key} className="rounded-card border border-line bg-white p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <PaymentIcon method={m.key} />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-[17px] font-semibold leading-tight text-ink">{m.label}</p>
                  <p className={cn("mt-0.5 text-sm font-medium", m.enabled ? "text-[#2E9D4F]" : "text-muted")}>Status: {m.enabled ? "Enabled" : "Disabled"}</p>
                </div>
                <Switch checked={m.enabled} onCheckedChange={(v) => patch(m.key, { enabled: v })} aria-label={`Enable ${m.label}`} />
              </div>
              <div className="mt-3 space-y-1.5">
                <Label htmlFor={`f-${m.key}`} className="flex items-center gap-1.5">
                  {m.fieldLabel}
                  {m.secret && <Lock className="h-3.5 w-3.5 text-gold-600" aria-label="Stored securely" />}
                </Label>
                <Input
                  id={`f-${m.key}`}
                  type={m.secret ? "password" : "text"}
                  autoComplete="off"
                  value={m.value}
                  placeholder={m.secret && m.configured ? "•••••••• saved — type to replace" : PAYMENT_PLACEHOLDER}
                  onChange={(e) => patch(m.key, { value: e.target.value })}
                />
                {m.secret && <p className="text-xs text-muted">Write-only. Never shown to customers.</p>}
              </div>
            </div>
          ))}

          <Button size="lg" className="mt-2 h-14 w-full text-[17px]" onClick={save} disabled={pending}>
            {flash ? <Check /> : <Package />}
            {pending ? "Saving…" : flash ? "Saved" : "Save Configuration"}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-sm text-ink">
            Changes apply to client checkout instantly <Info className="h-4 w-4 text-muted" />
          </p>
          <p className="text-center text-xs text-muted">
            Last saved: <span className="font-semibold text-jungle">{timeAgo(savedAt)}</span>
            {dirty && <span className="ml-2 font-semibold text-maroon">• Unsaved changes</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
