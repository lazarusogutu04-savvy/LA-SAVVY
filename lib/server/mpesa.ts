import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { envValue } from "./env";

/**
 * Safaricom Daraja STK Push (Lipa na M-Pesa Online). Credentials come from env and stay
 * "Will be provided later" until issued — callers then fall back to the manual Till.
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

/** Nairobi time stamp YYYYMMDDHHmmss as Daraja expects. */
function timestamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}${get("month")}${get("day")}${get("hour") === "24" ? "00" : get("hour")}${get("minute")}${get("second")}`;
}

export async function stkPush(opts: { phone: string; amount: number; reference: string; callbackUrl: string }) {
  const shortcode = envValue("MPESA_SHORTCODE")!;
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${envValue("MPESA_PASSKEY")}${ts}`).toString("base64");
  const res = await fetch(`${base()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(opts.amount)),
      PartyA: normalizeKePhone(opts.phone),
      PartyB: shortcode,
      PhoneNumber: normalizeKePhone(opts.phone),
      CallBackURL: opts.callbackUrl,
      AccountReference: opts.reference.slice(0, 12),
      TransactionDesc: "Mtaani Errands",
    }),
  });
  return (await res.json()) as { ResponseCode?: string; CheckoutRequestID?: string; errorMessage?: string; CustomerMessage?: string };
}

/** Signs the callback URL so only Daraja (who received it from us) can mark an order paid. */
export function callbackSignature(orderId: string) {
  return createHmac("sha256", `${envValue("MPESA_PASSKEY")}:${envValue("MPESA_CONSUMER_SECRET")}`).update(orderId).digest("hex").slice(0, 32);
}

export function verifyCallbackSignature(orderId: string, sig: string | null) {
  if (!sig || !mpesaConfigured()) return false;
  const a = Buffer.from(callbackSignature(orderId));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
