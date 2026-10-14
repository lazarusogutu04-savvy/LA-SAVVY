import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Daraja calls this after the customer completes/cancels the STK prompt. */
export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const cb = payload?.Body?.stkCallback;
  // TODO(Main Admin): persist to a payments table once Daraja credentials are live.
  console.log("[mpesa-callback]", cb?.CheckoutRequestID, cb?.ResultCode, cb?.ResultDesc);
  return json({ ResultCode: 0, ResultDesc: "Accepted" });
}
