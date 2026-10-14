import Link from "next/link";
import { BedDouble, Bike, Map, Package, Receipt, ShieldCheck, ShoppingBag } from "lucide-react";
import { BENCHMARK_ROUTE, company } from "@shared";
import { customerQuote } from "@/lib/server/pricing";
import { LogoFull } from "@/components/brand/logo";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { Button } from "@/components/ui/button";

const SERVICES = [
  { icon: Package, name: "Delivery", text: "Parcels across Nairobi on pooled scheduled or instant direct runs." },
  { icon: ShoppingBag, name: "Shopping", text: "Send your list — we shop at Quickmart, Naivas & local markets." },
  { icon: Receipt, name: "Bill Pay", text: "KPLC, water and county bills settled and receipted." },
  { icon: Bike, name: "Pickup", text: "Documents, keys, school items — collected and dropped." },
  { icon: Map, name: "Tours", text: "Vetted safari and day-tour partners via Savvy Market." },
  { icon: BedDouble, name: "BnB", text: "Trusted stays in Rongai, Kiserian and beyond." },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const q = await customerQuote(BENCHMARK_ROUTE);
  return (
    <>
      <SiteHeader />
      <section className="bg-jungle text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
              <ShieldCheck className="h-3.5 w-3.5" /> Ethical • Transparent • Fair
            </span>
            <h1 className="mt-4 text-4xl leading-tight md:text-5xl">
              Mtaani Errands, <span className="text-gold">done right.</span>
            </h1>
            <p className="mt-4 max-w-lg text-white/80">
              Deliveries, shopping, bill payments and pickups from {company.base}. One transparent formula, fair pay for riders, and no surge pricing.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/book">Book an Errand</Link></Button>
              <Button asChild size="lg" variant="gold"><Link href="#savvy">Savvy Market</Link></Button>
            </div>
            <p className="mt-6 text-sm text-white/70">CBD → Shangrila Villas, Rongai (22km): <b className="text-gold">KES {q.scheduled.total}</b> scheduled • <b className="text-gold">KES {q.instant.total}</b> instant</p>
          </div>
          <div className="flex justify-center"><LogoFull width={300} className="shadow-2xl" /></div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl text-jungle">Services</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ icon: Icon, name, text }) => (
            <div key={name} className="rounded-card border border-line bg-white p-5 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-btn bg-jungle"><Icon className="h-5 w-5 text-gold" /></span>
              <h3 className="mt-3 text-lg">{name}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="savvy" className="bg-mint">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl text-jungle">Savvy Market</h2>
          <p className="mt-2 max-w-2xl text-ink/80">
            Need something sourced? Request a quote and we&apos;ll find a vetted, ethically-sourcing supplier. Our service margin is a transparent 15–20%, agreed case-by-case before you pay.
          </p>
          <Button asChild className="mt-5"><a href={`mailto:${company.email}?subject=Savvy%20Market%20quote`}>Request a Quote</a></Button>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl text-jungle">About</h2>
        <p className="mt-2 max-w-2xl text-ink/80">
          Mtaani Errands is built by {company.name}, based in {company.base}. We believe local errands should be affordable for customers and fair for the riders and agents who run them.
        </p>
      </section>
      <SiteFooter />
    </>
  );
}
