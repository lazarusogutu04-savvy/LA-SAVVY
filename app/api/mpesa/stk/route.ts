import { NextResponse } from "next/server";
import { MANUAL_TILL } from "@/lib/config";
import { callbackSignature, mpesaConfigured, stkPush } from "@/lib/server/mpesa";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * POST { orderId, phone, amount } → M-Pesa STK push to the customer's phone.
 * When the Daraja keys are not provided yet, returns { manual: true, till } so the client
 * shows the manual Till instructions instead.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { orderId?: string; phone?: string; amount?: number };
  if (!body.orderId || !body.phone) return NextResponse.json({ ok: false, error: "orderId and phone are required" }, { status: 400 });

  if (!mpesaConfigured()) return NextResponse.json({ ok: true, manual: true, till: MANUAL_TILL });

  // Trust the stored order total over the client-sent amount when we can read it.
  let amount = Number(body.amount) || 0;
  const db = supabaseAdmin();
  if (db) {
    const { data } = await db.from("orders").select("total_price").eq("id", body.orderId).maybeSingle();
    if (data?.total_price) amount = data.total_price;
  }
  if (amount <= 0) return NextResponse.json({ ok: false, error: "Invalid amount" }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_SITE_URL : new URL(req.url).origin;
  try {
    const r = await stkPush({ phone: body.phone, amount, reference: body.orderId.slice(0, 8).toUpperCase(), callbackUrl: `${origin}/api/mpesa/callback?order=${body.orderId}&sig=${callbackSignature(body.orderId)}` });
    if (r.ResponseCode !== "0") return NextResponse.json({ ok: false, manual: true, till: MANUAL_TILL, error: r.errorMessage ?? "STK push failed" }, { status: 502 });
    if (db) await db.from("orders").update({ payment_status: "Awaiting M-Pesa PIN" }).eq("id", body.orderId);
    return NextResponse.json({ ok: true, checkoutRequestId: r.CheckoutRequestID, message: r.CustomerMessage });
  } catch (e) {
    return NextResponse.json({ ok: false, manual: true, till: MANUAL_TILL, error: (e as Error).message }, { status: 502 });
  }
}
