"use client";
import { useCallback, useEffect, useState } from "react";
import { FileText, Inbox, Loader2 } from "lucide-react";
import { useAdmin } from "@/components/admin/admin-context";
import { OrderActions } from "@/components/admin/order-actions";
import { countOrders, ensureRiderTokens, listAgents, listOrders, subscribeOrders } from "@/lib/data";
import type { Agent, Order } from "@/lib/types";
import { formatDate, kes, shortId } from "@/lib/utils";

export default function AdminDashboard() {
  const admin = useAdmin();
  const zone = admin.isMain ? null : admin.zone;
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0 });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([listOrders({ zone, limit: 20 }), countOrders(zone), listAgents(zone)])
      .then(async ([o, s, a]) => {
        setOrders(o);
        setStats(s);
        setAgents(a);
        // Rider live-location links for orders that already have a rider.
        const assigned = o.filter((x) => x.status === "Assigned" || x.status === "In Transit").map((x) => x.id);
        setTokens(await ensureRiderTokens(assigned).catch(() => ({})));
      })
      .catch((e) => setError(e.message));
  }, [zone]);

  useEffect(() => {
    load();
    return subscribeOrders(load);
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl text-jungle">Dashboard</h1>
        <p className="text-sm text-muted">{admin.isMain ? "All zones" : `${admin.zone} zone only`} • updates live</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Orders", value: stats.total, cls: "text-jungle" },
          { label: "Pending", value: stats.pending, cls: "text-maroon" },
          { label: "Delivered", value: stats.delivered, cls: "text-[#2E9D4F]" },
        ].map((s) => (
          <div key={s.label} className="rounded-card border border-line bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold text-muted">{s.label}</p>
            <p className={`font-heading text-3xl font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-line bg-white shadow-soft">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-base text-jungle">Latest orders</h2>
        </div>
        {error && <p className="p-4 text-sm text-maroon">{error}</p>}
        {!orders && !error && <Loader2 className="m-6 mx-auto h-6 w-6 animate-spin text-jungle" />}
        {orders?.length === 0 && (
          <div className="p-10 text-center">
            <Inbox className="mx-auto h-10 w-10 text-gold-600" />
            <p className="mt-2 font-semibold text-jungle">No orders yet</p>
          </div>
        )}
        {orders && orders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-mint text-xs uppercase tracking-wide text-jungle">
                <tr>
                  <th className="px-4 py-2.5">Route</th>
                  <th className="px-4 py-2.5">Task</th>
                  <th className="px-4 py-2.5">Price</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="align-top">
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="text-[11px] text-muted">
                        #{shortId(o.id)} • {formatDate(o.created_at)}
                      </p>
                      <p className="font-semibold text-jungle">
                        {o.from_location} → {o.to_location}
                      </p>
                      <p className="text-xs text-muted">
                        {o.distance_km} km{o.stops.length ? ` • ${o.stops.length} stop(s)` : ""} • {o.is_instant ? "Instant" : "Scheduled"}
                        {o.zone ? ` • ${o.zone}` : ""}
                      </p>
                      <p className="text-xs text-muted">{o.customer_name ?? ""} {o.customer_phone}</p>
                    </td>
                    <td className="max-w-[260px] px-4 py-3">
                      {o.category && <span className="mb-1 inline-block rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-[#6E5630]">{o.category}</span>}
                      <p className="text-ink">{o.description.length > 90 ? `${o.description.slice(0, 90)}…` : o.description}</p>
                      {o.file_urls.map((u, i) => (
                        <a key={i} href={u.startsWith("demo://") ? undefined : u} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs font-semibold text-jungle underline">
                          <FileText className="h-3 w-3" /> View file{o.file_urls.length > 1 ? ` ${i + 1}` : ""}
                        </a>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-bold text-maroon">{kes(o.total_price)}</p>
                      <p className="text-[11px] text-muted">{o.payment_status ?? "Pending"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="whitespace-nowrap rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-semibold text-jungle">{o.status}</span>
                      {o.agent_name && <p className="mt-1 text-[11px] text-muted">{o.agent_name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <OrderActions order={o} agents={agents} riderToken={tokens[o.id]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
