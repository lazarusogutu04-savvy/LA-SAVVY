import { requireMainAdmin } from "@/lib/server/auth";
import { getSetting } from "@/lib/server/db";
import type { CompetitorBenchmark, FairCapConfig } from "@/lib/server/fair-cap";
import { getPricingConfig } from "@/lib/server/pricing";
import { PricingForm } from "./pricing-form";

export const metadata = { title: "Pricing Config" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  await requireMainAdmin();
  const [pricing, cap, benchmarks] = await Promise.all([
    getPricingConfig(),
    getSetting<FairCapConfig>("fair_cap"),
    getSetting<CompetitorBenchmark[]>("competitor_benchmarks"),
  ]);
  return <PricingForm initial={{ pricing, cap, benchmarks }} />;
}
