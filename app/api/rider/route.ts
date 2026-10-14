import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";

const RIDER_STATUSES = ["In Transit", "Delivered"];

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

async function authorize(orderId: string | null | undefined, token: string | null | undefined) {
  const db = supabaseAdmin();
  if (!db) return { error: NextResponse.json({ ok: false, error: "Rider tracking activates once the Supabase keys are added" }, { status: 503 }) };
  if (!orderId || !token) return { error: NextResponse.json({ ok: false, error: "Invalid rider link" }, { status: 400 }) };
  const { data } = await db.from("rider_tokens").select("token").eq("order_id", orderId).maybeSingle();
  if (!data || !same(data.token, token)) return { error: NextResponse.json({ ok: false, error: "Invalid rider link" }, { status: 403 }) };
  return { db };
}

/** GET ?order=&t= → the job details the rider needs. */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const { db, error } = await authorize(p.get("order"), p.get("t"));
  if (error) return error;
  const { data } = await db
    .from("orders")
    .select("id,from_location,to_location,stops,description,file_urls,customer_name,customer_phone,is_instant,status,agent_name,rider_updated_at")
    .eq("id", p.get("order")!)
    .maybeSingle();
  if (!data) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true, order: data });
}

/** POST { orderId, token, lat?, lng?, status? } → live GPS + In Transit / Delivered. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { orderId?: string; token?: string; lat?: number; lng?: number; status?: string };
  const { db, error } = await authorize(b.orderId, b.token);
  if (error) return error;
  const patch: Record<string, unknown> = {};
  if (typeof b.lat === "number" && typeof b.lng === "number" && Math.abs(b.lat) <= 90 && Math.abs(b.lng) <= 180) {
    patch.rider_lat = b.lat;
    patch.rider_lng = b.lng;
    patch.rider_updated_at = new Date().toISOString();
  }
  if (b.status) {
    if (!RIDER_STATUSES.includes(b.status)) return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    patch.status = b.status;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: "Nothing to update" }, { status: 400 });
  const { error: e } = await db.from("orders").update(patch).eq("id", b.orderId!);
  if (e) return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
