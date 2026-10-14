import Link from "next/link";
import { AlertTriangle, BadgeDollarSign, Banknote, Package, ShieldCheck, Users } from "lucide-react";
import { BENCHMARK_ROUTE, formatKes, ORDER_STATUSES, type Agent, type Order, type Supplier } from "@shared";
import { PageTitle } from "@/components/admin/page-title";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession, usingDemoPassword } from "@/lib/server/auth";
import { getSetting, list } from "@/lib/server/db";
import { adminQuotePreview } from "@/lib/server/pricing";
import { expiringDocs } from "@/lib/server/suppliers";
import type { FairCapConfig } from "@/lib/server/fair-cap";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: { denied?: string } }) {
  const s = await requireSession();
  const isMain = s.role === "main_admin";
  const zoneFilter = isMain ? undefined : { zone: s.zone };
  const [orders, agents] = await Promise.all([list<Order>("orders", zoneFilter), list<Agent>("agents", zoneFilter)]);
  const revenue = orders.filter((o) => o.status === "Delivered").reduce((t, o) => t + o.totalKes, 0);
  const active = agents.filter((a) => a.status === "Active");

  const stats = [
    { label: "Orders", value: orders.length, icon: Package },
    { label: "Revenue (delivered)", value: formatKes(revenue), icon: Banknote },
    { label: "Active agents", value: `${active.length} • ${active.filter((a) => a.online).length} online`, icon: Users },
  ];

  return (
    <div>
      {searchParams.denied && <p className="mb-4 rounded-btn bg-maroon-50 p-3 text-sm font-medium text-maroon">That page is limited to the Main Admin.</p>}
      {isMain && usingDemoPassword() && (
        <p className="mb-4 flex items-center gap-2 rounded-btn border border-gold bg-gold-100 p-3 text-sm text-[#6E5630]">
          <AlertTriangle className="h-4 w-4" /> Demo login is active. Set <code>MAIN_ADMIN_PASSWORD</code> and <code>ADMIN_SESSION_SECRET</code> in Vercel before going live.
        </p>
      )}
      <PageTitle title={isMain ? "Dashboard" : `${s.zone} zone`} subtitle={isMain ? "Mtaani Errands at a glance" : "You can view and assign orders in your zone"} />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{label}</p>
              <Icon className="h-5 w-5 text-gold-600" />
            </div>
            <p className="mt-2 font-heading text-2xl font-bold text-jungle">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Orders by status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ORDER_STATUSES.map((st) => {
              const n = orders.filter((o) => o.status === st).length;
              return (
                <div key={st}>
                  <div className="flex justify-between text-sm"><span>{st}</span><span className="font-semibold">{n}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-mint"><div className="h-2 rounded-full bg-jungle" style={{ width: `${orders.length ? (n / orders.length) * 100 : 0}%` }} /></div>
                </div>
              );
            })}
            <Link href="/admin/orders" className="inline-block pt-1 text-sm font-semibold text-maroon hover:underline">Manage orders →</Link>
          </CardContent>
        </Card>
        {isMain ? <EthicalMonitor /> : null}
        {isMain ? <SupplierAlerts /> : null}
      </div>
    </div>
  );
}

async function EthicalMonitor() {
  const [preview, cap] = await Promise.all([adminQuotePreview(BENCHMARK_ROUTE), getSetting<FairCapConfig>("fair_cap")]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-gold-600" /> Ethical pricing monitor</CardTitle>
        <p className="text-sm text-muted">Benchmark: CBD → Shangrila Villas, Rongai • 22km</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {(["scheduled", "instant"] as const).map((t) => {
          const raw = preview.raw[t].total, cust = preview.customer[t].total;
          return (
            <div key={t} className="flex items-center justify-between rounded-btn bg-cream px-3 py-2">
              <span className="font-semibold capitalize">{t}</span>
              <span>
                Formula {formatKes(raw)} → Customer <b className="text-maroon">{formatKes(cust)}</b>
                {cust < raw && <Badge variant="gold" className="ml-2">ceiling applied</Badge>}
              </span>
            </div>
          );
        })}
        <div className="flex flex-wrap gap-2">
          <Badge variant="mint">Ethical mode ON • competitors hidden from clients</Badge>
          <Badge variant={cap.capEnabled ? "gold" : "muted"}>Fair ceiling {cap.capEnabled ? `ON • ${formatKes(preview.ceiling ?? 0)}` : "OFF"}</Badge>
          <Badge variant="mint">No surge pricing</Badge>
        </div>
        <Link href="/admin/pricing" className="inline-flex items-center gap-1 font-semibold text-maroon hover:underline"><BadgeDollarSign className="h-4 w-4" /> Pricing config →</Link>
      </CardContent>
    </Card>
  );
}

async function SupplierAlerts() {
  const suppliers = await list<Supplier>("suppliers");
  const alerts = suppliers.flatMap((s) => expiringDocs(s).map((d) => ({ s, d })));
  return (
    <Card>
      <CardHeader><CardTitle>Supplier expiry alerts</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        {alerts.length === 0 && <p className="text-muted">All supplier documents are current.</p>}
        {alerts.map(({ s, d }) => (
          <div key={s.id + d.name} className="flex items-center justify-between rounded-btn bg-cream px-3 py-2">
            <span><b>{s.name}</b> • {d.name}</span>
            <Badge variant={d.days! < 0 ? "danger" : "warning"}>{d.days! < 0 ? `Expired ${-d.days!}d ago` : `${d.days}d left`}</Badge>
          </div>
        ))}
        <Link href="/admin/suppliers" className="inline-block pt-1 font-semibold text-maroon hover:underline">Suppliers →</Link>
      </CardContent>
    </Card>
  );
}
