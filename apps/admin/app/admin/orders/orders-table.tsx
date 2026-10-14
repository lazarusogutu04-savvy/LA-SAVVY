"use client";
import { useState, useTransition } from "react";
import { Map, MessageCircle, Send } from "lucide-react";
import { formatKes, ORDER_STATUSES, type Agent, type Order, type OrderStatus } from "@shared";
import { AssignDialog, orderMessage } from "@/components/admin/assign-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { waLink } from "@/lib/utils";
import { setOrderStatus } from "../actions";

const STATUS_VARIANT: Record<OrderStatus, "warning" | "info" | "gold" | "success"> = {
  Pending: "warning",
  Assigned: "info",
  "In Transit": "gold",
  Delivered: "success",
};

export function OrdersTable({ orders, agents }: { orders: Order[]; agents: Agent[] }) {
  const [filter, setFilter] = useState<OrderStatus | "All">("All");
  const [assign, setAssign] = useState<{ open: boolean; orderId?: string }>({ open: false });
  const [map, setMap] = useState<Order | null>(null);
  const [, start] = useTransition();
  const rows = orders.filter((o) => filter === "All" || o.status === filter);
  const agent = (id: string | null) => agents.find((a) => a.id === id);

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-2 overflow-x-auto border-b border-line p-3">
        {(["All", ...ORDER_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${filter === s ? "bg-jungle text-white" : "bg-mint text-jungle"}`}>
            {s} {s !== "All" && `(${orders.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>
      <Table>
        <THead>
          <TR><TH>Order</TH><TH>Route</TH><TH>Zone</TH><TH>Service</TH><TH>Total</TH><TH>Status</TH><TH>Agent</TH><TH>Actions</TH></TR>
        </THead>
        <TBody>
          {rows.map((o) => {
            const a = agent(o.agentId);
            return (
              <TR key={o.id}>
                <TD><p className="font-semibold">#{o.code.replace("ME-", "")}</p><p className="text-xs text-muted">{o.category} • {o.customerName}</p></TD>
                <TD className="max-w-[220px] truncate" title={`${o.fromLabel} → ${o.toLabel}`}>{o.fromLabel} → {o.toLabel}<p className="text-xs text-muted">{o.distanceKm}km</p></TD>
                <TD>{o.zone}</TD>
                <TD>{o.tier === "instant" ? "Instant" : "Scheduled"}</TD>
                <TD className="font-semibold text-maroon">{formatKes(o.totalKes)}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[o.status]} className="mb-1">{o.status}</Badge>
                  <NativeSelect aria-label="Change status" value={o.status} onChange={(e) => start(() => setOrderStatus(o.id, e.target.value as OrderStatus))} className="h-8 w-32 text-xs">
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </NativeSelect>
                </TD>
                <TD>{a ? a.name : <span className="text-muted">Unassigned</span>}</TD>
                <TD>
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => setAssign({ open: true, orderId: o.id })} aria-label="Assign"><Send /> {o.agentId ? "Reassign" : "Assign"}</Button>
                    <Button size="sm" variant="outline" onClick={() => setMap(o)} aria-label="Map view"><Map /></Button>
                    <Button size="sm" variant="whatsapp" asChild aria-label="Share via WhatsApp">
                      <a href={waLink(a ? orderMessage(o, a) : `Mtaani Errands order #${o.code}: ${o.fromLabel} → ${o.toLabel}, ${formatKes(o.totalKes)}`, a?.phone)} target="_blank" rel="noreferrer"><MessageCircle /></a>
                    </Button>
                  </div>
                </TD>
              </TR>
            );
          })}
          {!rows.length && <TR><TD colSpan={8} className="py-10 text-center text-muted">No orders.</TD></TR>}
        </TBody>
      </Table>

      <AssignDialog open={assign.open} onOpenChange={(v) => setAssign((s) => ({ ...s, open: v }))} orders={orders} agents={agents} orderId={assign.orderId} />

      <Dialog open={!!map} onOpenChange={(v) => !v && setMap(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Map view • #{map?.code.replace("ME-", "")}</DialogTitle>
          <DialogDescription>{map?.fromLabel} → {map?.toLabel}</DialogDescription>
          {map?.toLat != null && map.toLng != null ? (
            <>
              <iframe
                title="Delivery location"
                className="mt-4 h-72 w-full rounded-card border border-line"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${map.toLng - 0.03},${map.toLat - 0.02},${map.toLng + 0.03},${map.toLat + 0.02}&layer=mapnik&marker=${map.toLat},${map.toLng}`}
              />
              <Button asChild variant="outline" className="mt-3 w-full">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${map.toLat},${map.toLng}&travelmode=driving`} target="_blank" rel="noreferrer">Open directions in Google Maps</a>
              </Button>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">No coordinates for this order.</p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
