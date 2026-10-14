export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminModeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2 rounded-btn border border-gold bg-gold-100 px-4 py-2.5 text-sm font-semibold text-[#6E5630]">
      <span className="h-2 w-2 animate-pulse rounded-full bg-gold-600" />
      {children}
    </div>
  );
}
