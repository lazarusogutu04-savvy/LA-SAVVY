import { env } from "@/lib/server/env";
import { bad, json } from "@/lib/server/http";
import { sendSupplierReminders } from "@/lib/server/reminders";

export const dynamic = "force-dynamic";

/** Daily Vercel Cron (see vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const secret = env.cronSecret();
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return bad("Unauthorized", 401);
  return json({ sent: await sendSupplierReminders() });
}
