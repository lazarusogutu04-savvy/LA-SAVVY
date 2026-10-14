import type { Order } from "@shared";
import { get } from "@/lib/server/db";
import { envValue } from "@/lib/server/env";
import { bad, body, json, str } from "@/lib/server/http";
import { mpesaConfigured, stkPush } from "@/lib/server/mpesa";

export const dynamic = "force-dynamic";

/** POST { orderId, phone } — amount always comes from the stored order, never the client. */
export async function POST(req: Request) {
  const b = await body(req);
  const order = await get<Order>("orders", str(b.orderId, 64));
  const phone = str(b.phone, 20);
  if (!order) return bad("Order not found", 404);
  if (!/^(\+?254|0)?7\d{8}$|^(\+?254|0)?1\d{8}$/.test(phone.replace(/\s/g, ""))) return bad("Enter a valid Safaricom number");

  if (!mpesaConfigured()) {
    return json({ status: "demo", message: "M-Pesa credentials: Will be provided later. Simulated prompt sent.", checkoutRequestId: `DEMO-${order.code}` });
  }
  const origin = envValue("NEXT_PUBLIC_SITE_URL") ?? new URL(req.url).origin;
  const result = await stkPush({ phone, amount: order.totalKes, reference: order.code, callbackUrl: `${origin}/api/payments/mpesa/callback` });
  return json({ status: result.ResponseCode === "0" ? "sent" : "failed", message: result.CustomerMessage ?? result.errorMessage, checkoutRequestId: result.CheckoutRequestID });
}
