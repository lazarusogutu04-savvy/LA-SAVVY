import type { Order } from "@shared";
import { requireMainAdmin } from "@/lib/server/auth";
import { listAgents } from "@/lib/server/agents";
import { list } from "@/lib/server/db";
import { UserManagement } from "./user-management";

export const metadata = { title: "User Management" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireMainAdmin();
  const [agents, orders] = await Promise.all([listAgents(), list<Order>("orders")]);
  return <UserManagement agents={agents} orders={orders} />;
}
