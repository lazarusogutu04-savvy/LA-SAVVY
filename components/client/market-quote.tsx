"use client";
import { useState } from "react";
import { CheckCircle2, Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createQuoteRequest } from "@/lib/data";

const MARKET_CATEGORIES = ["Groceries & Fresh Produce", "Household & Cleaning", "Building & Hardware", "Electronics", "Health & Pharmacy", "Fashion & Textiles", "Other"];

/** Savvy Market: Request Quote — description, category, supplier contact, margin note, ethical sourcing badge. */
export function MarketQuote({ phone }: { phone: string | null }) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(MARKET_CATEGORIES[0]);
  const [supplier, setSupplier] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return setError("Tell us what you need");
    setBusy(true);
    setError(null);
    try {
      await createQuoteRequest({ description: description.trim(), category, supplier_contact: supplier.trim(), customer_phone: phone });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="rounded-card border border-line bg-white p-5 text-center shadow-soft">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[#2E9D4F]" />
        <h3 className="mt-2 text-jungle">Quote requested</h3>
        <p className="text-sm text-muted">We&apos;ll source it ethically and send your quote by SMS / WhatsApp.</p>
        <Button variant="outline" className="mt-4" onClick={() => { setDone(false); setDescription(""); setSupplier(""); }}>
          Request another
        </Button>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4 rounded-card border border-line bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-jungle">Savvy Market — Request Quote</h3>
          <p className="text-xs text-muted">Bulk & specialty items sourced for you.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-jungle">
          <Leaf className="h-3 w-3" /> Ethical sourcing
        </span>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mq-desc">Description *</Label>
        <Textarea id="mq-desc" maxLength={500} placeholder="e.g. 50 bags of cement, 20 crates of eggs…" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mq-cat">Category</Label>
        <select id="mq-cat" className="h-11 w-full rounded-btn border border-line bg-white px-3 text-[15px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          {MARKET_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mq-sup">Supplier contact (optional)</Label>
        <Input id="mq-sup" placeholder="Preferred supplier name / phone" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
      </div>
      <p className="rounded-btn bg-gold-100 p-2.5 text-xs text-[#6E5630]">
        Transparent margin: supplier price <b>+15–20%</b> sourcing &amp; handling fee, shown on your quote. No hidden charges.
      </p>
      {error && <p className="text-sm font-medium text-maroon">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy && <Loader2 className="animate-spin" />} Request Quote
      </Button>
    </form>
  );
}
