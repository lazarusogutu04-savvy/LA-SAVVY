"use client";
import { useEffect, useState } from "react";
import { EyeOff, Loader2, Lock, Save } from "lucide-react";
import { AdminBanner } from "@/components/admin/admin-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getCompetitors, getPricingConfig, saveCompetitors, savePricingConfig } from "@/lib/data";
import { calcPrice, DEFAULT_PRICING } from "@/lib/pricing";
import type { Competitor, PricingConfig } from "@/lib/types";
import { formatDate, kes } from "@/lib/utils";

const BENCHMARK_KM = 22; // CBD → Rongai benchmark route

const FIELDS: { key: keyof PricingConfig; label: string; hint: string; step?: string }[] = [
  { key: "base_fee", label: "Base fee (KES)", hint: "Every errand" },
  { key: "per_km", label: "Per km rate (KES)", hint: "× route km" },
  { key: "traffic_multiplier", label: "Traffic multiplier", hint: "× traffic fee (low 10 / medium 20 / high 40)", step: "0.1" },
  { key: "stop_fee", label: "Per stop fee (KES)", hint: "Each extra stop (+3 km)" },
  { key: "instant_fee", label: "Instant urgency fee (KES)", hint: "Scheduled + this = Instant" },
];

export default function PricingConfigPage() {
  const [cfg, setCfg] = useState<PricingConfig | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getPricingConfig().then(setCfg);
    getCompetitors().then(setCompetitors);
  }, []);

  if (!cfg) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin text-jungle" />;

  const sample = calcPrice({ routeKm: BENCHMARK_KM, stopsCount: 0, trafficLevel: "medium", config: cfg });
  const avg = competitors.length ? competitors.reduce((s, c) => s + (c.min + c.max) / 2, 0) / competitors.length : 0;
  const target = Math.round(avg * 0.85);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const saved = await savePricingConfig(cfg!);
      await saveCompetitors(competitors);
      setCfg(saved);
      setMsg("Saved");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const num = (v: string) => (v === "" ? 0 : Number(v));

  return (
    <div className="space-y-5">
      <AdminBanner title="Pricing Config" subtitle="Main Admin only • customers only ever see the transparent formula" />

      <div className="rounded-card border border-line bg-white p-4 shadow-soft">
        <h2 className="mb-3 text-base text-jungle">Ethical formula</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                type="number"
                min="0"
                step={f.step ?? "1"}
                value={String(cfg[f.key] ?? "")}
                onChange={(e) => setCfg({ ...cfg, [f.key]: num(e.target.value) })}
              />
              <p className="text-[11px] text-muted">{f.hint}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-btn bg-mint p-3 text-sm text-jungle">
          Scheduled = {cfg.base_fee} + km × {cfg.per_km} + traffic × {cfg.traffic_multiplier} + stops × {cfg.stop_fee} • Instant = Scheduled + {cfg.instant_fee}
          <br />
          <span className="text-xs">
            Example {BENCHMARK_KM} km, medium traffic: Scheduled <b className="text-maroon">{kes(sample.scheduledPrice)}</b> • Instant{" "}
            <b className="text-maroon">{kes(sample.instantPrice)}</b>
          </span>
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setCfg({ ...DEFAULT_PRICING, ethical_mode: cfg.ethical_mode, last_saved: cfg.last_saved })}>
          Reset to defaults (80 + 12/km)
        </Button>
      </div>

      <div className="rounded-card border-2 border-dashed border-maroon/40 bg-white p-4 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base text-maroon">
            <Lock className="h-4 w-4" /> Internal competitor view — NEVER shown to clients
          </h2>
          <label className="flex items-center gap-2 text-sm font-semibold text-jungle">
            <EyeOff className="h-4 w-4" /> Ethical mode {cfg.ethical_mode ? "ON" : "OFF"}
            <Switch checked={cfg.ethical_mode} onCheckedChange={(v) => setCfg({ ...cfg, ethical_mode: v })} />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-mint text-left text-xs uppercase text-jungle">
              <tr>
                <th className="px-3 py-2">Competitor</th>
                <th className="px-3 py-2">Min KES</th>
                <th className="px-3 py-2">Max KES</th>
                <th className="px-3 py-2">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {competitors.map((c, i) => (
                <tr key={c.name}>
                  <td className="px-3 py-2 font-semibold">{c.name}</td>
                  {(["min", "max"] as const).map((k) => (
                    <td key={k} className="px-3 py-2">
                      <Input
                        type="number"
                        className="h-9 w-28"
                        value={c[k]}
                        onChange={(e) => setCompetitors(competitors.map((x, j) => (j === i ? { ...x, [k]: num(e.target.value) } : x)))}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">{kes((c.min + c.max) / 2)}</td>
                </tr>
              ))}
              <tr className="bg-cream font-semibold">
                <td className="px-3 py-2">Our Instant ({BENCHMARK_KM} km)</td>
                <td className="px-3 py-2 text-maroon" colSpan={2}>
                  {kes(sample.instantPrice)}
                </td>
                <td className="px-3 py-2">
                  {sample.instantPrice <= target ? (
                    <span className="rounded-full bg-[#E8F5E9] px-2 py-0.5 text-xs text-jungle">≥15% below avg ✓</span>
                  ) : (
                    <span className="rounded-full bg-maroon-50 px-2 py-0.5 text-xs text-maroon">Above target {kes(target)}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Policy: keep our pricing 15% below the competitor average (target ≤ {kes(target)} on the benchmark route). Ethical mode ON keeps competitor data off every client
          screen — it lives only in this Main-Admin-only table.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={busy} className="bg-[#7A1C1C]">
          {busy ? <Loader2 className="animate-spin" /> : <Save />} Save
        </Button>
        <span className="text-sm text-muted">Last saved: {formatDate(cfg.last_saved)}</span>
        {msg && <span className="text-sm font-semibold text-jungle">{msg}</span>}
      </div>
    </div>
  );
}
