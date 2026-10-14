import {
  BENCHMARK_ROUTE,
  DEFAULT_PRICING,
  PAYMENT_PLACEHOLDER,
  quoteAll,
  type PaymentMethodKey,
  type RouteEstimate,
  type TierQuote,
} from "@shared";

/** Base URL of the deployed admin portal (Vercel), which hosts the public API. */
const raw = process.env.EXPO_PUBLIC_API_URL;
export const API_URL = raw && raw !== "Will be provided later" ? raw.replace(/\/$/, "") : null;

export interface Quotes {
  scheduled: TierQuote;
  instant: TierQuote;
}
export interface Formula {
  baseFee: number;
  perKm: number;
  trafficRate: number;
}
export interface PublicMethod {
  key: PaymentMethodKey;
  label: string;
  fieldLabel: string;
  value: string;
  configured: boolean;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? "Request failed");
  return json as T;
}

/**
 * Route + fair quotes. The server applies the hidden ethical ceiling; the offline fallback
 * shows the plain formula as an estimate. No competitor data ever exists in this app.
 */
export async function fetchRouteAndQuotes(from: string, to: string): Promise<{ route: RouteEstimate; quotes: Quotes; formula: Formula; estimate: boolean }> {
  if (API_URL) {
    try {
      const r = await post<{ route: RouteEstimate; quotes: Quotes; formula: Formula }>("/api/public/route", { from, to });
      return { ...r, estimate: false };
    } catch {
      /* fall through to offline estimate */
    }
  }
  const route = { ...BENCHMARK_ROUTE, fromLabel: from || BENCHMARK_ROUTE.fromLabel, toLabel: to || BENCHMARK_ROUTE.toLabel };
  const { baseFee, perKm, trafficRate } = DEFAULT_PRICING;
  return { route, quotes: quoteAll(route), formula: { baseFee, perKm, trafficRate }, estimate: true };
}

export async function fetchPaymentMethods(): Promise<PublicMethod[]> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/api/public/config`);
      const j = await res.json();
      return j.payments.methods;
    } catch {
      /* offline */
    }
  }
  return [
    { key: "mpesa_stk", label: "M-Pesa STK Push", fieldLabel: "Business Shortcode", value: PAYMENT_PLACEHOLDER, configured: false },
    { key: "mpesa_paybill", label: "Paybill Number", fieldLabel: "Paybill Number", value: PAYMENT_PLACEHOLDER, configured: false },
    { key: "paypal", label: "PayPal", fieldLabel: "PayPal Email", value: PAYMENT_PLACEHOLDER, configured: false },
    { key: "card", label: "Card (Visa / Mastercard)", fieldLabel: "Card API Keys", value: PAYMENT_PLACEHOLDER, configured: false },
  ];
}

export async function placeOrder(input: {
  route: RouteEstimate;
  tier: "scheduled" | "instant";
  category: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethodKey;
}): Promise<{ id: string; code: string; totalKes: number; message: string }> {
  if (!API_URL) {
    const total = quoteAll(input.route)[input.tier].total;
    return { id: "demo", code: `ME-${Date.now().toString().slice(-6)}`, totalKes: total, message: "Demo mode: connect EXPO_PUBLIC_API_URL to place real orders." };
  }
  const last = input.route.segments.at(-1)?.coords.at(-1);
  const { order } = await post<{ order: { id: string; code: string; totalKes: number } }>("/api/public/orders", {
    distanceKm: input.route.distanceKm,
    trafficDelayMin: input.route.trafficDelayMin,
    tier: input.tier,
    category: input.category,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    paymentMethod: input.paymentMethod,
    fromLabel: input.route.fromLabel,
    toLabel: input.route.toLabel,
    toLat: last?.latitude,
    toLng: last?.longitude,
  });
  let message = "Order confirmed. A rider will be assigned shortly.";
  if (input.paymentMethod === "mpesa_stk") {
    const s = await post<{ message: string }>("/api/payments/mpesa/stk-push", { orderId: order.id, phone: input.customerPhone });
    message = s.message ?? "Check your phone and enter your M-Pesa PIN.";
  }
  return { ...order, message };
}

export async function requestQuote(input: { description: string; category: string; supplierContact: string; customerPhone: string }) {
  if (!API_URL) return { id: "demo", status: "New" };
  return post<{ id: string; status: string }>("/api/public/quote-requests", input);
}
