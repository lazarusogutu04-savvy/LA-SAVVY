export function AdminBanner({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-card bg-gold px-4 py-3 text-jungle">
      <div>
        <h1 className="font-heading text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-jungle/80">{subtitle}</p>}
      </div>
      <span className="rounded-full bg-jungle px-3 py-1 text-xs font-bold text-gold">Admin mode active</span>
    </div>
  );
}
