import Link from "next/link";
import { LogOut, MapPin, ShieldCheck } from "lucide-react";
import { company } from "@shared";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoLockup } from "@/components/brand/logo";
import { requireSession } from "@/lib/server/auth";
import { dataMode } from "@/lib/server/db";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const isMain = session.role === "main_admin";
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 bg-jungle text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <Link href="/admin">
            <LogoLockup subtitle="Mtaani Errands • Admin" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{session.name}</p>
              <p className="inline-flex items-center gap-1 rounded-full bg-maroon px-2 py-0.5 text-[11px] font-semibold">
                {isMain ? <ShieldCheck className="h-3 w-3 text-gold" /> : <MapPin className="h-3 w-3 text-gold" />}
                {isMain ? "Main Admin" : `Zone Admin • ${session.zone}`}
              </p>
            </div>
            <form action={logout}>
              <button className="rounded-btn p-2 text-white/80 hover:bg-white/10 hover:text-gold" aria-label="Sign out">
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="rounded-card border border-line bg-white p-2 shadow-soft lg:sticky lg:top-24">
            <AdminNav isMain={isMain} />
            <p className="mt-3 hidden border-t border-line px-3 pt-3 text-[11px] text-muted lg:block">
              Data: {dataMode() === "supabase" ? "Supabase (live)" : "Demo store"}
            </p>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <footer className="py-6 text-center text-xs text-muted">{company.footer}</footer>
    </div>
  );
}
