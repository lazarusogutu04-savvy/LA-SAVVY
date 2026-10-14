import "server-only";
import { envValue } from "./env";

/**
 * Safaricom Daraja STK Push (Lipa na M-Pesa Online). All credentials come from env and
 * stay "Will be provided later" until the Main Admin receives them from Safaricom.
 */
export function mpesaConfigured() {
  return Boolean(envValue("MPESA_CONSUMER_KEY") && envValue("MPESA_CONSUMER_SECRET") && envValue("MPESA_SHORTCODE") && envValue("MPESA_PASSKEY"));
}

const base = () => (envValue("MPESA_ENV") === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke");

async function token() {
  const auth = Buffer.from(`${envValue("MPESA_CONSUMER_KEY")}:${envValue("MPESA_CONSUMER_SECRET")}`).toString("base64");
  const res = await fetch(`${base()}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Daraja auth failed (${res.status})`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export function normalizeKePhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.startsWith("254")) return d;
  if (d.startsWith("0")) return `254${d.slice(1)}`;
  return `254${d}`;
}

export async function stkPush(opts: { phone: string; amount: number; reference: string; callbackUrl: string }) {
  const shortcode = envValue("MPESA_SHORTCODE")!;
  const ts = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const password = Buffer.from(`${shortcode}${envValue("MPESA_PASSKEY")}${ts}`).toString("base64");
  const res = await fetch(`${base()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(opts.amount),
      PartyA: normalizeKePhone(opts.phone),
      PartyB: shortcode,
      PhoneNumber: normalizeKePhone(opts.phone),
      CallBackURL: opts.callbackUrl,
      AccountReference: opts.reference.slice(0, 12),
      TransactionDesc: "Mtaani Errands",
    }),
  });
  return res.json();
}
