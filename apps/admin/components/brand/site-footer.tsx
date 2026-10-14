import { company } from "@shared";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-jungle text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm md:flex-row md:items-center md:justify-between">
        <p>{company.footer}</p>
        <p className="flex gap-4">
          <a className="text-gold hover:underline" href={`mailto:${company.email}`}>{company.email}</a>
          <a className="text-gold hover:underline" href={company.website}>www.lasavvy.co.ke</a>
        </p>
      </div>
    </footer>
  );
}
