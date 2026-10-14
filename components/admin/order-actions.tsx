"use client";
import { useState } from "react";
import { Loader2, MessageCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureRiderTokens, riderLink, updateOrder } from "@/lib/data";
import { ORDER_STEPS, type Agent, type Order, type OrderStatus } from "@/lib/types";
import { kes, shortId, waLink } from "@/lib/utils";

export function orderShareText(o: Order, origin: string, riderToken?: string) {
  return [
    `Mtaani Errands order #${shortId(o.id)}`,
    `From: ${o.from_location}`,
    ...o.stops.map((s, i) => `Stop ${i + 1}: ${s}`),
    `To: ${o.to_location}`,
    `Task: ${o.description}`,
    o.file_url && !o.file_url.startsWith("data:") ? `File: ${o.file_url}` : null,
    `Customer: ${o.customer_name ?? ""} ${o.customer_phone ?? ""}`.trim(),
    `${o.distance_km} km • ${o.is_instant ? "INSTANT" : "Scheduled"} • ${kes(o.total_price)}`,
    `Customer tracking: ${origin}/track/${o.id}`,
    riderToken ? `RIDER: open this link to start the trip & share live location:\n${riderLink(origin, o.id, riderToken)}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Assign Delivery (sets status Assigned + agent) and Share via WhatsApp. */
export function OrderActions({ order, agents, riderToken }: { order: Order; agents: Agent[]; riderToken?: string }) {
  const active = agents.filter((a) => a.status !== "Inactive");
  const [agentId, setAgentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const agent = active.find((a) => a.id === agentId);

  async function run(patch: Partial<Order>) {
    setBusy(true);
    setError(null);
    try {
      await updateOrder(order.id, patch);
      // Assigning creates the rider's secret live-location link (included in Share via WhatsApp).
      if (patch.status === "Assigned") await ensureRiderTokens([order.id]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const sharePhone = agent?.phone ?? order.agent_phone;

  return (
    <div className="flex min-w-[220px] flex-col gap-1.5">
      {order.status === "Pending" ? (
        <>
          {active.length > 0 && (
            <select aria-label="Agent" className="h-9 rounded-btn border border-line bg-white px-2 text-xs" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
              <option value="">Choose agent…</option>
              {active.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} • {a.zone}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" disabled={busy} onClick={() => run({ status: "Assigned", agent_name: agent?.name ?? null, agent_phone: agent?.phone ?? null })}>
            {busy ? <Loader2 className="animate-spin" /> : <Truck />} Assign Delivery
          </Button>
        </>
      ) : (
        <select
          aria-label="Status"
          className="h-9 rounded-btn border border-line bg-white px-2 text-xs"
          value={order.status}
          disabled={busy}
          onChange={(e) => run({ status: e.target.value as OrderStatus })}
        >
          {ORDER_STEPS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      )}
      <Button asChild size="sm" variant="whatsapp">
        <a href={waLink(orderShareText(order, origin, riderToken), sharePhone)} target="_blank" rel="noreferrer">
          <MessageCircle /> Share via WhatsApp
        </a>
      </Button>
      {error && <p className="text-[11px] text-maroon">{error}</p>}
    </div>
  );
}
