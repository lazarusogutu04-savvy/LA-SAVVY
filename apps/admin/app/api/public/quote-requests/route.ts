import type { QuoteRequest } from "@shared";
import { insert } from "@/lib/server/db";
import { bad, body, json, str } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Savvy Market: customer requests a sourcing quote (priced case-by-case, +15–20% margin). */
export async function POST(req: Request) {
  const b = await body(req);
  const description = str(b.description, 1000);
  const customerPhone = str(b.customerPhone, 20);
  if (description.length < 5 || !customerPhone) return bad("Description and phone are required");
  const q = await insert<QuoteRequest>("quote_requests", {
    description,
    category: str(b.category, 60) || "General",
    supplierContact: str(b.supplierContact, 120),
    customerPhone,
    status: "New",
  });
  return json({ id: q.id, status: q.status }, 201);
}
