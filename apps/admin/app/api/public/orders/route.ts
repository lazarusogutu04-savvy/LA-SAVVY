import { ERRAND_CATEGORIES, type Order, type PaymentMethodKey } from "@shared";
import { insert } from "@/lib/server/db";
import { bad, body, json, num, str } from "@/lib/server/http";
import { publicPaymentConfig } from "@/lib/server/payments";
import { customerQuote } from "@/lib/server/pricing";
import { zoneFor } from "@/lib/server/zones";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await body(req);
  const distanceKm = num(b.distanceKm, 0.1, 300);
  const trafficDelayMin = num(b.trafficDelayMin ?? 0, 0, 600) ?? 0;
  const tier = b.tier === "instant" ? "instant" : "scheduled";
  const phone = str(b.customerPhone, 20);
  const payment = str(b.paymentMethod, 20) as PaymentMethodKey;
  if (distanceKm == null || !/^\+?\d{9,13}$/.test(phone.replace(/\s/g, ""))) return bad("Valid distanceKm and customerPhone are required");

  const enabled = (await publicPaymentConfig()).methods.map((m) => m.key);
  if (!enabled.includes(payment)) return bad("Payment method is not available");

  // Never trust a client-sent total: recompute server-side.
  const quote = (await customerQuote({ distanceKm, trafficDelayMin }))[tier];
  const fromLabel = str(b.fromLabel, 120);
  const toLabel = str(b.toLabel, 120);
  const category = (ERRAND_CATEGORIES as readonly string[]).includes(str(b.category)) ? str(b.category) : "Delivery";
  const order = await insert<Order>("orders", {
    code: `ME-${Date.now().toString().slice(-6)}`,
    customerName: str(b.customerName, 80) || "Mtaani customer",
    customerPhone: phone,
    category,
    fromLabel,
    toLabel,
    zone: zoneFor(fromLabel, toLabel),
    distanceKm,
    tier,
    totalKes: quote.total,
    paymentMethod: payment,
    status: "Pending",
    agentId: null,
    toLat: num(b.toLat, -90, 90) ?? undefined,
    toLng: num(b.toLng, -180, 180) ?? undefined,
  });
  return json({ order: { id: order.id, code: order.code, totalKes: order.totalKes, status: order.status } }, 201);
}
