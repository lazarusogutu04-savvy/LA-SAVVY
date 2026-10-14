import { company } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-md px-4 py-6 text-center text-xs text-muted">
      <p className="font-semibold text-jungle">{company.tagline}</p>
      <p className="mt-1">
        {company.name} • <a href={`mailto:${company.email}`} className="underline">{company.email}</a>
      </p>
      <p>{company.footer}</p>
    </footer>
  );
}
