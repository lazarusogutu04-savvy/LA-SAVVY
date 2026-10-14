"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageCircle, Truck, UserPlus } from "lucide-react";
import { useAdmin } from "@/components/admin/admin-context";
import { AdminBanner } from "@/components/admin/admin-banner";
import { orderShareText } from "@/components/admin/order-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAgent, ensureRiderTokens, listAgents, listOrders, subscribeOrders, updateAgent, updateOrder } from "@/lib/data";
import { AGENT_ROLES, ZONES, type Agent, type Order } from "@/lib/types";
import { cn, isKePhone, kes, shortId, toE164, waLink } from "@/lib/utils";

const empty = { name: "", phone: "", national_id: "", email: "", role: AGENT_ROLES[0] as string, zone: ZONES[0] as string };

export default function AgentsPage() {
  const admin = useAdmin();
  const zone = admin.isMain ? null : admin.zone;
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [pending, setPending] = useState<Order[]>([]);
  const [form, setForm] = useState({ ...empty, zone: zone ?? ZONES[0] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");

  const load = useCallback(() => {
    Promise.all([listAgents(zone), listOrders({ zone, limit: 100 })])
      .then(([a, o]) => {
        setAgents(a);
        setPending(o.filter((x) => x.status === "Pending"));
      })
      .catch((e) => setError(e.message));
  }, [zone]);

  useEffect(() => {
    load();
    return subscribeOrders(load);
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Name is required");
    if (!isKePhone(form.phone)) return setError("Enter a valid Kenyan phone, e.g. 0712 345 678");
    if (!admin.isMain && form.zone !== admin.zone) return setError(`You can only add agents in ${admin.zone}`);
    setBusy(true);
    try {
      await addAgent({
        name: form.name.trim(),
        phone: toE164(form.phone),
        national_id: form.national_id.trim() || null,
        email: form.email.trim().toLowerCase() || null,
        role: form.role,
        zone: form.zone,
        status: "Active",
      });
      setForm({ ...empty, zone: zone ?? ZONES[0] });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const shown = (agents ?? []).filter((a) => filter === "All" || a.zone === filter);

  return (
    <div className="space-y-5">
      <AdminBanner title="Agents" subtitle={admin.isMain ? "Add and manage minor admins in every zone" : `Limited to ${admin.zone} zone`} />

      <form onSubmit={submit} className="rounded-card border border-line bg-white p-4 shadow-soft">
        <h2 className="mb-3 flex items-center gap-2 text-base text-jungle">
          <UserPlus className="h-5 w-5 text-gold-600" /> Add Minor Admin
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="a-name">Name</Label>
            <Input id="a-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="a-phone">Phone</Label>
            <Input id="a-phone" inputMode="tel" placeholder="07..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="a-id">National ID</Label>
            <Input id="a-id" value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="a-role">Role</Label>
            <select id="a-role" className="h-11 w-full rounded-btn border border-line bg-white px-3" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {AGENT_ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="a-zone">Zone</Label>
            <select
              id="a-zone"
              className="h-11 w-full rounded-btn border border-line bg-white px-3 disabled:opacity-60"
              value={form.zone}
              disabled={!admin.isMain}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
            >
              {ZONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="a-email">Login email (optional)</Label>
            <Input id="a-email" type="email" placeholder="For admin portal access" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        {error && <p className="mt-3 text-sm font-medium text-maroon">{error}</p>}
        <Button type="submit" className="mt-4" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <UserPlus />} Add
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-base text-jungle">Agents</h2>
          {admin.isMain &&
            ["All", ...ZONES].map((z) => (
              <button
                key={z}
                onClick={() => setFilter(z)}
                className={cn("rounded-full px-3 py-1 text-xs font-semibold", filter === z ? "bg-jungle text-white" : "border border-line bg-white text-jungle")}
              >
                {z}
              </button>
            ))}
        </div>
        {!agents && <Loader2 className="mx-auto h-6 w-6 animate-spin text-jungle" />}
        {agents && shown.length === 0 && <p className="rounded-card border border-line bg-white p-6 text-center text-sm text-muted">No agents yet — add one above.</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((a) => (
            <AgentCard key={a.id} agent={a} pending={pending} onChanged={load} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, pending, onChanged }: { agent: Agent; pending: Order[]; onChanged: () => void }) {
  const zonePending = pending.filter((o) => !o.zone || o.zone === agent.zone || agent.zone === "Nairobi Wide");
  const options = zonePending.length ? zonePending : pending;
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAssigned, setJustAssigned] = useState<{ order: Order; token: string } | null>(null);
  const chosen = options.find((o) => o.id === orderId) ?? options[0];
  const active = agent.status !== "Inactive";

  async function assign() {
    if (!chosen) return;
    setBusy(true);
    setError(null);
    try {
      await updateOrder(chosen.id, { status: "Assigned", agent_name: agent.name, agent_phone: agent.phone });
      const tokens = await ensureRiderTokens([chosen.id]);
      setJustAssigned({ order: chosen, token: tokens[chosen.id] });
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle() {
    try {
      await updateAgent(agent.id, { status: active ? "Inactive" : "Active" });
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = justAssigned
    ? orderShareText(justAssigned.order, origin, justAssigned.token)
    : chosen
      ? orderShareText(chosen, origin) : `Hi ${agent.name}, welcome to Mtaani Errands (${agent.zone}). — LA & Savvy Limited`;

  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading font-bold text-jungle">{agent.name}</p>
          <p className="text-xs text-muted">
            {agent.role} • {agent.phone}
            {agent.national_id ? ` • ID ${agent.national_id}` : ""}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={toggle} className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", active ? "bg-[#E8F5E9] text-jungle" : "bg-[#EEEBE4] text-muted")}>
            {active ? "Active" : "Inactive"}
          </button>
          <span className="rounded-full bg-gold-100 px-2.5 py-1 text-[11px] font-bold text-[#6E5630]">{agent.zone}</span>
        </div>
      </div>
      {active && (
        <div className="mt-3 space-y-2">
          {options.length > 0 ? (
            <select aria-label="Pending order" className="h-9 w-full rounded-btn border border-line bg-white px-2 text-xs" value={chosen?.id ?? ""} onChange={(e) => setOrderId(e.target.value)}>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  #{shortId(o.id)} • {o.from_location.split(",")[0]} → {o.to_location.split(",")[0]} • {kes(o.total_price)}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-muted">No pending orders to assign.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" disabled={busy || !chosen} onClick={assign}>
              {busy ? <Loader2 className="animate-spin" /> : <Truck />} Assign Delivery
            </Button>
            <Button asChild size="sm" variant="whatsapp">
              <a href={waLink(shareText, agent.phone)} target="_blank" rel="noreferrer">
                <MessageCircle /> Share via WhatsApp
              </a>
            </Button>
          </div>
        </div>
      )}
      {justAssigned && (
        <p className="mt-2 rounded-btn bg-mint p-2 text-xs text-jungle">
          Assigned #{shortId(justAssigned.order.id)}. Tap <b>Share via WhatsApp</b> to send {agent.name} the job + live-location link.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-maroon">{error}</p>}
    </div>
  );
}
