"use client";
import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Clock, Mail, MessageCircle, Plus, ShieldCheck, Store, X, XCircle } from "lucide-react";
import { ZONES, type QuoteRequest, type Supplier, type Zone } from "@shared";
import { PageTitle } from "@/components/admin/page-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, timeAgo, waLink } from "@/lib/utils";
import { addSupplier, remindSupplier, setQuoteStatus, setSupplierDoc, setSupplierMargin, setSupplierVetting } from "../actions";

type Doc = Supplier["documents"][number] & { days: number | null };
type S = Omit<Supplier, "documents"> & { documents: Doc[] };

const DOC_ICON = { Verified: CheckCircle2, Pending: Clock, Rejected: XCircle } as const;
const DOC_COLOR = { Verified: "text-[#2E9D4F]", Pending: "text-[#E0A21B]", Rejected: "text-[#C0392B]" } as const;
const DOC_BADGE = { Verified: "success", Pending: "warning", Rejected: "danger" } as const;

export function SuppliersView({ suppliers, quotes }: { suppliers: S[]; quotes: QuoteRequest[] }) {
  const [selId, setSelId] = useState(suppliers[0]?.id);
  const sel = suppliers.find((s) => s.id === selId);
  const [notes, setNotes] = useState(sel?.notes ?? "");
  const [msg, setMsg] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [nf, setNf] = useState({ name: "", category: "", contactName: "", phone: "", email: "", zone: "Rongai" as Zone });
  const [pending, start] = useTransition();

  const pick = (s: S) => { setSelId(s.id); setNotes(s.notes); setMsg(""); };
  const expiring = (s: S) => s.documents.filter((d) => d.days != null && d.days <= 30);
  const avgMargin = suppliers.length ? suppliers.reduce((t, s) => t + s.marginPct, 0) / suppliers.length : 0;

  return (
    <div>
      <PageTitle
        title="Suppliers"
        subtitle={`Savvy Market vetting • average margin ${avgMargin.toFixed(1)}% (target 15–20%)`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" disabled={pending} onClick={() => start(async () => setMsg(`Reminders sent: ${(await remindSupplier()).join(", ") || "none needed"}`))}>
              <Mail /> Send all expiry reminders
            </Button>
            <Button onClick={() => setAddOpen(true)}><Plus /> Add supplier</Button>
          </div>
        }
      />
      {msg && <p className="mb-4 rounded-btn bg-mint p-3 text-sm text-jungle">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="h-fit p-3">
          <p className="px-2 pb-2 text-sm font-semibold">Suppliers</p>
          <ul className="space-y-2">
            {suppliers.map((s) => (
              <li key={s.id}>
                <button onClick={() => pick(s)} className={cn("w-full rounded-btn border p-3 text-left", s.id === selId ? "border-maroon bg-maroon-50" : "border-line bg-white")}>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted">{s.zone} • {s.category}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge variant={s.vettingStatus === "Approved" ? "success" : s.vettingStatus === "Rejected" ? "danger" : "warning"}>{s.vettingStatus}</Badge>
                    {expiring(s).length > 0 && <Badge variant="danger"><AlertTriangle className="h-3 w-3" /> {expiring(s).length} expiring</Badge>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {sel && (
          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon"><Store className="h-5 w-5 text-gold" /></span>
                <div>
                  <h2 className="text-xl">{sel.name} <span className="font-sans text-base font-normal text-muted">— Detail View</span></h2>
                  <p className="text-xs text-muted">{sel.category} • {sel.contactName} • {sel.phone} • {sel.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={pending} onClick={() => start(() => setSupplierVetting(sel.id, "Approved", notes))}><CheckCircle2 /> Approve</Button>
                <Button size="sm" variant="outline" disabled={pending} onClick={() => start(() => setSupplierVetting(sel.id, "Rejected", notes))}><X /> Reject</Button>
              </div>
            </div>

            <h3 className="mt-6 text-base">Document Checklist</h3>
            <p className="text-xs text-muted">Verify submitted documents and track expiry dates</p>
            <ul className="mt-3 divide-y divide-line rounded-btn border border-line">
              {sel.documents.map((d) => {
                const Icon = DOC_ICON[d.status];
                return (
                  <li key={d.name} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                    <span className="flex flex-1 items-center gap-2 text-sm font-medium"><Icon className={cn("h-5 w-5", DOC_COLOR[d.status])} /> {d.name}</span>
                    {d.days != null && d.days <= 30 && (
                      <Badge variant={d.days < 0 ? "danger" : "warning"}>{d.days < 0 ? `Expired ${-d.days}d ago` : `Expires in ${d.days}d`}</Badge>
                    )}
                    <Input type="date" className="h-9 w-40 text-sm" defaultValue={d.expiresOn ?? ""} aria-label={`${d.name} expiry`} onBlur={(e) => e.target.value !== (d.expiresOn ?? "") && start(() => setSupplierDoc(sel.id, d.name, d.status, e.target.value || null))} />
                    <NativeSelect className="h-9 w-32 text-sm" value={d.status} aria-label={`${d.name} status`} onChange={(e) => start(() => setSupplierDoc(sel.id, d.name, e.target.value as Doc["status"], d.expiresOn))}>
                      {(["Verified", "Pending", "Rejected"] as const).map((x) => <option key={x}>{x}</option>)}
                    </NativeSelect>
                    <Badge variant={DOC_BADGE[d.status]} className="hidden sm:inline-flex">{d.status}</Badge>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Margin % (case-by-case, 15–20%)</Label>
                <Input type="number" defaultValue={sel.marginPct} key={sel.id} min={0} max={100} onBlur={(e) => start(() => setSupplierMargin(sel.id, +e.target.value))} />
                {(sel.marginPct < 15 || sel.marginPct > 20) && <p className="text-xs text-maroon">Outside the 15–20% guideline</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Expiry reminders</Label>
                <p className="text-sm text-muted">Last sent: {timeAgo(sel.lastReminderAt)} • auto daily via cron</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => setMsg(`Reminder: ${(await remindSupplier(sel.id)).join(", ") || "no expiring documents"}`))}><Mail /> Email now</Button>
                  <Button size="sm" variant="whatsapp" asChild><a href={waLink(`Hello ${sel.contactName}, this is Mtaani Errands (LA & Savvy Limited). Please update your supplier documents.`, sel.phone)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-1.5">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" disabled={pending} onClick={() => start(() => setSupplierVetting(sel.id, sel.vettingStatus, notes))}>Save Draft</Button>
              <Button disabled={pending} onClick={() => start(() => setSupplierVetting(sel.id, sel.documents.every((d) => d.status === "Verified") ? "Approved" : "Pending Review", notes))}>
                <ShieldCheck /> Finalize Review
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="text-lg">Savvy Market quote requests</h2>
        <ul className="mt-3 divide-y divide-line">
          {quotes.map((q) => (
            <li key={q.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="font-medium">{q.description}</p>
                <p className="text-xs text-muted">{q.category} • {q.customerPhone}{q.supplierContact && ` • supplier: ${q.supplierContact}`} • {timeAgo(q.createdAt)}</p>
              </div>
              <NativeSelect className="h-9 w-32 text-sm" value={q.status} onChange={(e) => start(() => setQuoteStatus(q.id, e.target.value as QuoteRequest["status"]))}>
                {(["New", "Quoted", "Closed"] as const).map((x) => <option key={x}>{x}</option>)}
              </NativeSelect>
              <Button size="sm" variant="whatsapp" asChild><a href={waLink(`Hi! Mtaani Errands here about your Savvy Market request: "${q.description}". Our quote (incl. transparent 15–20% service margin) is: `, q.customerPhone)} target="_blank" rel="noreferrer"><MessageCircle /> Send quote</a></Button>
            </li>
          ))}
          {!quotes.length && <p className="py-3 text-sm text-muted">No requests yet.</p>}
        </ul>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogTitle>Add supplier</DialogTitle>
          <DialogDescription>New suppliers start in Pending Review with a standard document checklist.</DialogDescription>
          <div className="mt-4 space-y-3">
            {(["name", "category", "contactName", "phone", "email"] as const).map((k) => (
              <div key={k} className="space-y-1.5">
                <Label htmlFor={`s-${k}`}>{{ name: "Business name", category: "Category", contactName: "Contact person", phone: "Phone", email: "Email" }[k]}</Label>
                <Input id={`s-${k}`} value={nf[k]} onChange={(e) => setNf({ ...nf, [k]: e.target.value })} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="s-zone">Zone</Label>
              <NativeSelect id="s-zone" value={nf.zone} onChange={(e) => setNf({ ...nf, zone: e.target.value as Zone })}>{ZONES.map((z) => <option key={z}>{z}</option>)}</NativeSelect>
            </div>
            <Button className="w-full" disabled={pending} onClick={() => start(async () => { const r = await addSupplier(nf); if (!r.error) setAddOpen(false); else setMsg(r.error); })}><Plus /> Add supplier</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
