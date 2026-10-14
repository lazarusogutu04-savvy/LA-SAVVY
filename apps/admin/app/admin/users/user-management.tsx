"use client";
import { useState, useTransition } from "react";
import { MessageCircle, Plus, Send, UserPlus } from "lucide-react";
import { AGENT_ROLES, ZONES, type Agent, type AgentRole, type Order, type Zone } from "@shared";
import { AssignDialog } from "@/components/admin/assign-dialog";
import { PageTitle } from "@/components/admin/page-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, waLink } from "@/lib/utils";
import { addAgent, setAgentStatus } from "../actions";

const AVATAR = ["bg-[#2E9D4F]", "bg-[#6C87A3]", "bg-jungle", "bg-maroon", "bg-gold-600"];
const ROLE_BADGE: Record<AgentRole, string> = {
  "Errand Agent": "bg-mint text-jungle ring-1 ring-[#BFDDBF]",
  "Delivery Guy": "bg-[#DCE8F7] text-[#1C4E80] ring-1 ring-[#B8CDE8]",
  Supplier: "bg-gold-100 text-[#6E5630] ring-1 ring-gold",
};
const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
const fmtPhone = (p: string) => p.replace(/^\+254(\d{3})(\d{3})(\d{3})$/, "+254 $1 $2 $3");

export function UserManagement({ agents, orders }: { agents: Agent[]; orders: Order[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [assign, setAssign] = useState<{ open: boolean; agentId?: string }>({ open: false });
  const [created, setCreated] = useState<{ agent: Agent; accessCode: string } | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", nationalId: "", role: "Errand Agent" as AgentRole, zone: "Rongai" as Zone });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const assigned = orders.filter((o) => o.agentId).slice(0, 6);
  const agentName = (id: string | null) => agents.find((a) => a.id === id)?.name ?? "—";

  const submit = () =>
    start(async () => {
      setError("");
      const res = await addAgent(form);
      if ("error" in res && res.error) return setError(res.error);
      if ("agent" in res && res.agent) {
        setCreated({ agent: res.agent, accessCode: res.accessCode! });
        setForm({ name: "", phone: "", nationalId: "", role: "Errand Agent", zone: "Rongai" });
      }
    });

  const welcome = (a: Agent, code: string) =>
    `*Welcome to Mtaani Errands*\nHi ${a.name.split(" ")[0]}, you've been added as ${a.role} for ${a.zone} zone.\nSign in: ${typeof window !== "undefined" ? window.location.origin : ""}/login (Zone Admin tab)\nPhone: ${a.phone}\nAccess code: ${code}\nYou can view and manage ${a.zone} orders only.\n— LA & Savvy Limited`;

  return (
    <div>
      <PageTitle
        title="User Management"
        subtitle="Manage admins, errand agents, and delivery personnel"
        action={
          <Button onClick={() => { setCreated(null); setError(""); setAddOpen(true); }}>
            <Plus /> Add New Admin/Agent
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <h2 className="text-lg">Team Members</h2>
          <p className="text-sm text-muted">Minor Admins — Errand Agents, Delivery Guys &amp; Suppliers • limited to their assigned zone</p>
          <ul className="mt-4 divide-y divide-line">
            {agents.map((a, i) => (
              <li key={a.id} className="flex flex-col gap-3 py-4 2xl:flex-row 2xl:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", AVATAR[i % AVATAR.length])}>{initials(a.name)}</span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {a.name}
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", ROLE_BADGE[a.role])}>{a.role}</span>
                    </p>
                    <p className="text-sm text-muted">{fmtPhone(a.phone)}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs">
                      <span className={cn("font-semibold", a.status === "Active" ? "text-jungle" : "text-muted")}>{a.status} • {a.zone}</span>
                      <span className={cn("flex items-center gap-1", a.online ? "text-[#2E9D4F]" : "text-muted")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", a.online ? "bg-[#2E9D4F]" : "bg-muted")} /> {a.online ? "Online" : "Offline"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pl-14 2xl:pl-0">
                  <Button size="sm" disabled={a.status !== "Active"} onClick={() => setAssign({ open: true, agentId: a.id })}>
                    <Send /> Assign Delivery
                  </Button>
                  <Button size="sm" variant="whatsapp" asChild>
                    <a href={waLink(`Hi ${a.name.split(" ")[0]}, this is Mtaani Errands admin.`, a.phone)} target="_blank" rel="noreferrer">
                      <MessageCircle /> Share via WhatsApp
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => start(() => setAgentStatus(a.id, a.status === "Active" ? "Inactive" : "Active"))}>
                    {a.status === "Active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="h-fit p-5">
          <h2 className="text-lg">Orders — Shared / Assigned</h2>
          <ol className="mt-3 space-y-3">
            {assigned.map((o, i) => (
              <li key={o.id} className="flex gap-3 rounded-btn bg-cream p-3 text-sm">
                <span className="font-heading font-bold text-jungle">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Order #{o.code.replace("ME-", "")}</p>
                  <p>Assigned to {agentName(o.agentId)}</p>
                  <p className="text-xs text-muted">{o.toLabel}</p>
                </div>
                <Badge variant={o.status === "Delivered" ? "muted" : "mint"} className="h-fit">{o.status}</Badge>
              </li>
            ))}
            {!assigned.length && <p className="text-sm text-muted">No assignments yet.</p>}
          </ol>
        </Card>
      </div>

      <AssignDialog open={assign.open} onOpenChange={(v) => setAssign((s) => ({ ...s, open: v }))} orders={orders} agents={agents} agentId={assign.agentId} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          {created ? (
            <>
              <DialogTitle>Agent added</DialogTitle>
              <DialogDescription>Share this one-time access code now — it is stored hashed and can&apos;t be shown again.</DialogDescription>
              <div className="mt-4 rounded-card bg-mint p-4 text-center">
                <p className="text-sm">{created.agent.name} • {created.agent.zone}</p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-jungle">{created.accessCode}</p>
              </div>
              <Button variant="whatsapp" className="mt-4 w-full" asChild>
                <a href={waLink(welcome(created.agent, created.accessCode), created.agent.phone)} target="_blank" rel="noreferrer">
                  <MessageCircle /> Share via WhatsApp
                </a>
              </Button>
            </>
          ) : (
            <>
              <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-gold-600" /> Add New Admin/Agent</DialogTitle>
              <DialogDescription>Minor admins get access to their assigned zone only.</DialogDescription>
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5"><Label htmlFor="na">Name</Label><Input id="na" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sarah Otieno" /></div>
                <div className="space-y-1.5"><Label htmlFor="ph">Phone</Label><Input id="ph" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254712345678" /></div>
                <div className="space-y-1.5"><Label htmlFor="id">National ID</Label><Input id="id" inputMode="numeric" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} placeholder="12345678" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ro">Role</Label>
                    <NativeSelect id="ro" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AgentRole })}>
                      {AGENT_ROLES.map((r) => <option key={r}>{r}</option>)}
                    </NativeSelect>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="zo">Zone</Label>
                    <NativeSelect id="zo" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value as Zone })}>
                      {ZONES.map((z) => <option key={z}>{z}</option>)}
                    </NativeSelect>
                  </div>
                </div>
                {error && <p className="text-sm font-medium text-maroon">{error}</p>}
                <Button className="w-full" onClick={submit} disabled={pending}><Plus /> {pending ? "Adding…" : "Add Admin/Agent"}</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
