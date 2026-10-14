import type { Order } from "@shared";
import { PageTitle } from "@/components/admin/page-title";
import { listAgents } from "@/lib/server/agents";
import { requireSession } from "@/lib/server/auth";
import { list } from "@/lib/server/db";
import { OrdersTable } from "./orders-table";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const s = await requireSession();
  const filter = s.role === "main_admin" ? undefined : { zone: s.zone };
  const [orders, agents] = await Promise.all([list<Order>("orders", filter), listAgents(filter)]);
  return (
    <div>
      <PageTitle title="Orders" subtitle={s.role === "main_admin" ? "All zones" : `${s.zone} zone only`} />
      <OrdersTable orders={orders} agents={agents} />
    </div>
  );
}
