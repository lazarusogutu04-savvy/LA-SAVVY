"use client";
import { BadgeCheck, CheckCircle2, Clock, Leaf, ShieldCheck } from "lucide-react";
import { formatKes, type Tier, type TierQuote } from "@shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Formula {
  baseFee: number;
  perKm: number;
  trafficRate: number;
}

export function EthicalBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold bg-gold-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6E5630]">
      <ShieldCheck className="h-3.5 w-3.5 text-gold-600" /> Ethical • Transparent • Fair
    </span>
  );
}

function TierCard({ q, onSelect, selected }: { q: TierQuote; onSelect: (t: Tier) => void; selected: boolean }) {
  const Icon = q.tier === "scheduled" ? Leaf : Clock;
  return (
    <div className={cn("flex flex-col rounded-card border-2 bg-white p-5 shadow-soft transition", selected ? "border-maroon" : "border-line")}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-sm font-bold uppercase tracking-wide text-jungle">{q.label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint">
          <Icon className="h-5 w-5 text-gold-600" />
        </span>
      </div>
      <p className="mt-2 font-heading text-[34px] font-bold leading-none text-maroon">{formatKes(q.total)}</p>
      <p className="mt-1.5 text-sm font-medium text-muted">
        {q.eta} • {q.mode}
      </p>
      <ul className="mt-4 flex-1 space-y-2 text-sm">
        {q.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" /> {b}
          </li>
        ))}
      </ul>
      <Button className="mt-5 w-full" onClick={() => onSelect(q.tier)}>
        {selected ? "Selected" : "Select"}
      </Button>
    </div>
  );
}

function sumLine(q: TierQuote) {
  return q.lines
    .map((l, i) => (i === 0 ? `${l.amount}` : l.amount < 0 ? `− ${-l.amount}` : `+ ${l.amount}`))
    .join(" ");
}

export function EthicalPricing({
  scheduled,
  instant,
  formula,
  distanceKm,
  selected,
  onSelect,
}: {
  scheduled: TierQuote;
  instant: TierQuote;
  formula: Formula;
  distanceKm: number;
  selected: Tier | null;
  onSelect: (t: Tier) => void;
}) {
  const distanceAmt = scheduled.lines[1]?.amount ?? 0;
  return (
    <div className="space-y-5">
      {/* Exactly two options. No competitor comparison, ever. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TierCard q={scheduled} onSelect={onSelect} selected={selected === "scheduled"} />
        <TierCard q={instant} onSelect={onSelect} selected={selected === "instant"} />
      </div>

      <section className="rounded-card border border-line bg-mint/70 p-5">
        <h3 className="text-base text-jungle">How we calculate your price</h3>
        <p className="mt-2 rounded-btn bg-white px-3 py-2 text-center font-heading text-sm font-semibold text-jungle">
          Base {formula.baseFee} + distance × {formula.perKm} + traffic × {formula.trafficRate} = Total
        </p>
        <p className="mt-3 text-sm text-ink">
          Example: Base {formula.baseFee} + {distanceKm}km × {formula.perKm} = {distanceAmt} + traffic
        </p>
        <div className="mt-3 space-y-2 text-sm">
          {[scheduled, instant].map((q) => (
            <details key={q.tier} className="rounded-btn bg-white px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <span className="font-semibold">{q.tier === "scheduled" ? "Scheduled" : "Instant"}</span>
                <span className="font-mono text-[13px]">
                  {sumLine(q)} = <b className="text-maroon">{q.total}</b>
                </span>
              </summary>
              <ul className="mt-2 space-y-1 border-t border-line pt-2 text-[13px] text-muted">
                {q.lines.map((l) => (
                  <li key={l.label} className="flex justify-between">
                    <span>{l.label}</span>
                    <span className={l.amount < 0 ? "text-[#2E9D4F]" : ""}>{l.amount < 0 ? `− KES ${-l.amount}` : `KES ${l.amount}`}</span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-5 text-center">
        <p className="text-sm text-ink">
          We price fairly to support riders with fair pay • Transparent formula • No dynamic surge pricing • All prices inclusive
        </p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-jungle px-4 py-2 text-sm font-semibold text-gold">
          <BadgeCheck className="h-5 w-5" /> Ethical Pricing Guarantee
        </span>
      </section>
    </div>
  );
}
