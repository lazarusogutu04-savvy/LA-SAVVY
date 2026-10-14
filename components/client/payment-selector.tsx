"use client";
import { PaymentIcon, type PaymentMethodKey } from "@/components/brand/payment-icons";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PLACEHOLDER } from "@/lib/config";
import type { PaymentConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

export const PAYMENT_METHODS: { key: PaymentMethodKey; title: string; sub: string; enabledKey: keyof PaymentConfig }[] = [
  { key: "mpesa_stk", title: "M-Pesa STK Push", sub: "Prompt sent to your phone", enabledKey: "mpesa_stk_enabled" },
  { key: "mpesa_paybill", title: "Paybill Number", sub: "Pay from your M-Pesa menu", enabledKey: "paybill_enabled" },
  { key: "paypal", title: "PayPal", sub: "Pay with your PayPal account", enabledKey: "paypal_enabled" },
  { key: "card", title: "Card", sub: "Visa / Mastercard", enabledKey: "card_enabled" },
];

/** 4 payment cards — toggle (maroon when ON) + editable input. Only one method can be ON. */
export function PaymentSelector({
  method,
  onMethod,
  details,
  onDetails,
  config,
}: {
  method: PaymentMethodKey;
  onMethod: (m: PaymentMethodKey) => void;
  details: Record<PaymentMethodKey, string>;
  onDetails: (d: Record<PaymentMethodKey, string>) => void;
  config: PaymentConfig | null;
}) {
  return (
    <div className="space-y-2.5">
      {PAYMENT_METHODS.map((m) => {
        const on = method === m.key;
        const live = config ? Boolean(config[m.enabledKey]) : m.key === "mpesa_stk";
        return (
          <div key={m.key} className={cn("rounded-card border-2 bg-white p-3 transition-colors", on ? "border-maroon" : "border-line")}>
            <div className="flex items-center gap-3">
              <PaymentIcon method={m.key} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{m.title}</p>
                <p className="text-xs text-muted">{live ? m.sub : "Not active yet — we'll confirm via M-Pesa Till"}</p>
              </div>
              <Switch checked={on} onCheckedChange={(v) => v && onMethod(m.key)} aria-label={m.title} />
            </div>
            {on && (
              <Input
                className="mt-2.5"
                placeholder={PLACEHOLDER}
                value={details[m.key]}
                onChange={(e) => onDetails({ ...details, [m.key]: e.target.value })}
                aria-label={`${m.title} details`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
