import { company } from "@shared";
import { json } from "@/lib/server/http";
import { publicPaymentConfig } from "@/lib/server/payments";
import { clientPricing, getPricingConfig } from "@/lib/server/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const [payments, pricing] = await Promise.all([publicPaymentConfig(), getPricingConfig()]);
  return json({ company, payments, pricing: clientPricing(pricing) });
}
