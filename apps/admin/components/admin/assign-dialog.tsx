"use client";
import { useEffect, useState, useTransition } from "react";
import { MapPin, Send } from "lucide-react";
import { formatKes, type Agent, type Order } from "@shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/input";
import { waLink } from "@/lib/utils";
import { assignOrder } from "@/app/admin/actions";

export function orderMessage(o: Order, a: Agent) {
  return [
    `*Mtaani Errands • New delivery*`,
    `Hi ${a.name.split(" ")[0]}, you've been assigned Order #${o.code.replace("ME-", "")}.`,
    `${o.category}: ${o.fromLabel} → ${o.toLabel} (${o.distanceKm}km)`,
    `Service: ${o.tier === "instant" ? "Instant Premium" : "Scheduled Standard"} • ${formatKes(o.totalKes)}`,
    `Customer: ${o.customerName} ${o.customerPhone}`,
    o.toLat ? `Map: https://maps.google.com/?q=${o.toLat},${o.toLng}` : "",
    `— LA & Savvy Limited, Rongai`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Assign Delivery modal (reference: User Management). One click assigns + opens WhatsApp. */
export function AssignDialog({
  open,
  onOpenChange,
  orders,
  agents,
  orderId,
  agentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orders: Order[];
  agents: Agent[];
  orderId?: string;
  agentId?: string;
}) {
  const pendingOrders = orders.filter((o) => o.status === "Pending" || o.id === orderId);
  const [oid, setOid] = useState(orderId ?? pendingOrders[0]?.id ?? "");
  const [aid, setAid] = useState(agentId ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const order = orders.find((o) => o.id === oid);
  const eligible = agents.filter((a) => a.status === "Active");

  useEffect(() => {
    if (!open) return;
    const o = orderId ?? orders.find((x) => x.status === "Pending")?.id ?? "";
    setOid(o);
    const ord = orders.find((x) => x.id === o);
    setAid(agentId ?? eligible.find((a) => a.zone === ord?.zone && a.online)?.id ?? eligible[0]?.id ?? "");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId, agentId]);

  const share = () =>
    start(async () => {
      const a = agents.find((x) => x.id === aid);
      if (!order || !a) return;
      // Open the WhatsApp tab synchronously-ish to avoid popup blockers on iOS Safari.
      const win = window.open("about:blank", "_blank");
      const res = await assignOrder(order.id, a.id);
      if ("error" in res && res.error) {
        win?.close();
        setError(res.error);
        return;
      }
      const url = waLink(orderMessage(order, a), a.phone);
      if (win) win.location.href = url;
      else window.location.href = url;
      onOpenChange(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Assign Delivery</DialogTitle>
        {order ? (
          <DialogDescription className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> Order #{order.code.replace("ME-", "")} • {order.toLabel}
          </DialogDescription>
        ) : (
          <DialogDescription>No pending orders right now.</DialogDescription>
        )}
        <div className="mt-4 space-y-4">
          {!orderId && pendingOrders.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="ad-order">Order</Label>
              <NativeSelect id="ad-order" value={oid} onChange={(e) => setOid(e.target.value)}>
                {pendingOrders.map((o) => (
                  <option key={o.id} value={o.id}>#{o.code.replace("ME-", "")} • {o.toLabel} • {o.zone}</option>
                ))}
              </NativeSelect>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="ad-agent">Select Agent</Label>
            <NativeSelect id="ad-agent" value={aid} onChange={(e) => setAid(e.target.value)}>
              {eligible.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.online ? "Online" : "Offline"} • {a.zone}</option>
              ))}
            </NativeSelect>
          </div>
          {error && <p className="text-sm font-medium text-maroon">{error}</p>}
          <Button className="w-full justify-between" disabled={!order || !aid || pending} onClick={share}>
            <span className="flex-1 text-center">{pending ? "Assigning…" : "Share Order"}</span>
            <Send />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
