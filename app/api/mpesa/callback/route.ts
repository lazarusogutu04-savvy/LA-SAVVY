import { NextResponse } from "next/server";
import { verifyCallbackSignature } from "@/lib/server/mpesa";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";

/** Daraja STK callback → marks the order Paid / Failed (customer sees it live on /track/[id]). */
export async function POST(req: Request) {
  const params = new URL(req.url).searchParams;
  const orderId = params.get("order");
  if (!orderId || !verifyCallbackSignature(orderId, params.get("sig"))) return NextResponse.json({ ResultCode: 1, ResultDesc: "Rejected" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { Body?: { stkCallback?: { ResultCode?: number; ResultDesc?: string } } } | null;
  const cb = body?.Body?.stkCallback;
  const db = supabaseAdmin();
  if (cb && db) {
    await db
      .from("orders")
      .update({ payment_status: cb.ResultCode === 0 ? "Paid" : `Failed: ${cb.ResultDesc ?? "cancelled"}` })
      .eq("id", orderId);
  }
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
