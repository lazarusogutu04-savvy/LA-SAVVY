import "server-only";
import { PAYMENT_PLACEHOLDER, type PaymentConfig } from "@shared";
import { getSetting, setSetting } from "./db";

export async function getPaymentConfig(): Promise<PaymentConfig> {
  return getSetting<PaymentConfig>("payment_config");
}

/** What the client checkout receives: enabled methods with public values or the placeholder. */
export async function publicPaymentConfig() {
  const cfg = await getPaymentConfig();
  return {
    updatedAt: cfg.updatedAt,
    methods: cfg.methods
      .filter((m) => m.enabled)
      .map((m) => ({
        key: m.key,
        label: m.label,
        fieldLabel: m.fieldLabel,
        value: m.secret ? (m.configured ? "Secure checkout" : PAYMENT_PLACEHOLDER) : m.value.trim() || PAYMENT_PLACEHOLDER,
        configured: m.secret ? Boolean(m.configured) : Boolean(m.value.trim()),
      })),
  };
}

export async function savePaymentConfig(next: PaymentConfig["methods"], by: string) {
  const current = await getPaymentConfig();
  const secrets = (await getSetting<Record<string, string>>("payment_secrets")) ?? {};
  const methods = current.methods.map((m) => {
    const n = next.find((x) => x.key === m.key);
    if (!n) return m;
    if (m.secret) {
      // Secret values are write-only: blank means "keep existing".
      if (n.value.trim()) secrets[m.key] = n.value.trim();
      return { ...m, enabled: n.enabled, value: "", configured: Boolean(secrets[m.key]) };
    }
    return { ...m, enabled: n.enabled, value: n.value.trim().slice(0, 120) };
  });
  const saved: PaymentConfig = { methods, updatedAt: new Date().toISOString(), updatedBy: by };
  await setSetting("payment_secrets", secrets);
  await setSetting("payment_config", saved);
  return saved;
}
