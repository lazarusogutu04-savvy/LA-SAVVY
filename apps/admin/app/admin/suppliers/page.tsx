import type { QuoteRequest, Supplier } from "@shared";
import { requireMainAdmin } from "@/lib/server/auth";
import { list } from "@/lib/server/db";
import { daysUntil } from "@/lib/server/suppliers";
import { SuppliersView } from "./suppliers-view";

export const metadata = { title: "Suppliers" };
export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  await requireMainAdmin();
  const [suppliers, quotes] = await Promise.all([list<Supplier>("suppliers"), list<QuoteRequest>("quote_requests")]);
  const withDays = suppliers.map((s) => ({ ...s, documents: s.documents.map((d) => ({ ...d, days: daysUntil(d.expiresOn) })) }));
  return <SuppliersView suppliers={withDays} quotes={quotes} />;
}
