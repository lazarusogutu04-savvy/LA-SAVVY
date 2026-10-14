"use client";
import { useMemo, useState, useTransition } from "react";
import { EyeOff, Lock, Plus, Save, Trash2 } from "lucide-react";
import { BENCHMARK_ROUTE, formatKes, quoteAll, type PricingConfig, type Tier } from "@shared";
import { AdminModeBanner, PageTitle } from "@/components/admin/page-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { timeAgo } from "@/lib/utils";
import { savePricing } from "../actions";

interface Benchmark { name: string; minKes: number; maxKes: number }
interface Cap { ethicalMode: boolean; capEnabled: boolean; capFactor: number; benchmarkKm: number }

function NumField({ label, value, onChange, step = 1, hint }: { label: string; value: number; onChange: (n: number) => void; step?: number; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" step={step} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(parseFloat(e.target.value))} />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function PricingForm({ initial }: { initial: { pricing: PricingConfig; cap: Cap; benchmarks: Benchmark[] } }) {
  const [p, setP] = useState(initial.pricing);
  const [cap, setCap] = useState(initial.cap);
  const [bm, setBm] = useState(initial.benchmarks);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const setTier = (t: Tier, patch: Partial<PricingConfig[Tier]>) => setP((x) => ({ ...x, [t]: { ...x[t], ...patch } }));

  const preview = useMemo(() => {
    const q = quoteAll(BENCHMARK_ROUTE, p);
    const mids = bm.map((b) => (b.minKes + b.maxKes) / 2);
    const avg = mids.length ? mids.reduce((a, b) => a + b, 0) / mids.length : null;
    const ceiling = cap.capEnabled && avg != null ? Math.floor((avg * (BENCHMARK_ROUTE.distanceKm / (cap.benchmarkKm || 22)) * cap.capFactor) / 10) * 10 : null;
    return { q, avg, ceiling };
  }, [p, cap, bm]);

  const save = () => start(async () => setSavedAt((await savePricing({ pricing: p, cap, benchmarks: bm })).savedAt));

  return (
    <div className="space-y-6">
      <AdminModeBanner>Admin mode active • Internal pricing view (Main Admin only)</AdminModeBanner>
      <PageTitle
        title="Pricing Config"
        subtitle="Base 80 + distance × 12 + traffic × 1 = Total • customers only ever see this formula"
        action={<Button onClick={save} disabled={pending}><Save /> {pending ? "Saving…" : "Save Changes"}</Button>}
      />
      {savedAt && <p className="-mt-3 text-xs text-muted">Last saved {timeAgo(savedAt)}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Formula</CardTitle><CardDescription>Applied to every route, both tiers.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <NumField label="Base fee (KES)" value={p.baseFee} onChange={(n) => setP({ ...p, baseFee: n })} />
            <NumField label="Per km rate (KES)" value={p.perKm} onChange={(n) => setP({ ...p, perKm: n })} />
            <NumField label="Traffic multiplier (KES / min)" value={p.trafficRate} step={0.1} onChange={(n) => setP({ ...p, trafficRate: n })} />
            <NumField label="Round to (KES)" value={p.roundTo} onChange={(n) => setP({ ...p, roundTo: n })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Scheduled vs Instant</CardTitle><CardDescription>Urgency fee (+) or pooled saving (−) and traffic exposure.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <NumField label="Scheduled urgency fee" value={p.scheduled.urgencyFee} onChange={(n) => setTier("scheduled", { urgencyFee: n })} hint="−80 = pooled batch saving" />
            <NumField label="Scheduled traffic share" value={p.scheduled.trafficFactor} step={0.05} onChange={(n) => setTier("scheduled", { trafficFactor: n })} hint="0.45 = off-peak window" />
            <NumField label="Instant urgency fee" value={p.instant.urgencyFee} onChange={(n) => setTier("instant", { urgencyFee: n })} />
            <NumField label="Instant traffic share" value={p.instant.trafficFactor} step={0.05} onChange={(n) => setTier("instant", { trafficFactor: n })} hint="1.0 = live traffic" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-gold-600" /> Internal competitor benchmark</CardTitle>
              <Badge variant="muted"><EyeOff className="h-3 w-3" /> Never shown to clients</Badge>
            </div>
            <CardDescription>Reference prices for the 22km benchmark route. Backend keeps customer prices at or below average × {cap.capFactor} (≈{Math.round((1 - cap.capFactor) * 100)}% below).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead><TR><TH>Competitor</TH><TH>Min (KES)</TH><TH>Max (KES)</TH><TH>Average</TH><TH /></TR></THead>
              <TBody>
                {bm.map((b, i) => (
                  <TR key={i}>
                    <TD><Input value={b.name} onChange={(e) => setBm(bm.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="h-9 w-32" /></TD>
                    <TD><Input type="number" value={b.minKes} onChange={(e) => setBm(bm.map((x, j) => (j === i ? { ...x, minKes: +e.target.value } : x)))} className="h-9 w-24" /></TD>
                    <TD><Input type="number" value={b.maxKes} onChange={(e) => setBm(bm.map((x, j) => (j === i ? { ...x, maxKes: +e.target.value } : x)))} className="h-9 w-24" /></TD>
                    <TD className="font-semibold">{formatKes((b.minKes + b.maxKes) / 2)}</TD>
                    <TD><Button variant="ghost" size="icon" onClick={() => setBm(bm.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 /></Button></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setBm([...bm, { name: "", minKes: 0, maxKes: 0 }])}><Plus /> Add benchmark</Button>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-between gap-3 rounded-btn border border-line p-3">
                <div><p className="text-sm font-semibold">Ethical mode</p><p className="text-xs text-muted">Hides competitors from client</p></div>
                <Switch checked disabled aria-label="Ethical mode (always on)" />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-btn border border-line p-3">
                <div><p className="text-sm font-semibold">Fair-price ceiling</p><p className="text-xs text-muted">min(formula, avg × factor)</p></div>
                <Switch checked={cap.capEnabled} onCheckedChange={(v) => setCap({ ...cap, capEnabled: v })} aria-label="Fair-price ceiling" />
              </div>
              <NumField label="Ceiling factor" value={cap.capFactor} step={0.01} onChange={(n) => setCap({ ...cap, capFactor: n })} hint="0.85 = 15% below average" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Live preview • CBD → Shangrila Villas Rongai • 22km</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {(["scheduled", "instant"] as const).map((t) => {
              const q = preview.q[t];
              const final = preview.ceiling != null ? Math.min(q.total, preview.ceiling) : q.total;
              return (
                <div key={t} className="rounded-card bg-cream p-4">
                  <p className="font-heading font-bold text-jungle">{q.label}</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {q.lines.map((l) => (
                      <li key={l.label} className="flex justify-between"><span className="text-muted">{l.label}</span><span>{l.amount}</span></li>
                    ))}
                  </ul>
                  <p className="mt-2 flex items-center justify-between border-t border-line pt-2">
                    <span className="text-sm">Customer pays</span>
                    <span className="font-heading text-xl font-bold text-maroon">{formatKes(final)}</span>
                  </p>
                  {final < q.total && <p className="mt-1 text-xs text-[#6E5630]">Ceiling {formatKes(preview.ceiling!)} applied (formula {formatKes(q.total)}). Customers see a neutral “Fair-price ceiling” line.</p>}
                </div>
              );
            })}
            <p className="text-xs text-muted sm:col-span-2">Competitor average {preview.avg != null ? formatKes(preview.avg) : "—"} • ceiling {preview.ceiling != null ? formatKes(preview.ceiling) : "off"}.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
