"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { AdminContext } from "@/components/admin/admin-context";
import { LogoMark } from "@/components/brand/logo";
import { getAdminSession, signOut } from "@/lib/auth";
import { company } from "@/lib/config";
import type { AdminSession } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", mainOnly: false },
  { href: "/admin/agents", label: "Agents", mainOnly: false },
  { href: "/admin/pricing", label: "Pricing", mainOnly: true },
  { href: "/admin/payments", label: "Payments", mainOnly: true },
];

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    getAdminSession().then((s) => {
      if (!s) router.replace("/admin/login");
      else setSession(s);
    });
  }, [router]);

  const item = NAV.find((n) => n.href === path);
  const denied = session && item?.mainOnly && !session.isMain;

  async function logout() {
    await signOut();
    router.replace("/admin/login");
  }

  if (!session)
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Loader2 className="h-6 w-6 animate-spin text-jungle" />
      </div>
    );

  return (
    <AdminContext.Provider value={session}>
      <div className="min-h-screen bg-cream">
        <header className="sticky top-0 z-40 bg-jungle text-white shadow-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="rounded-full bg-gold p-0.5">
                <LogoMark size={38} className="rounded-full" />
              </span>
              <span className="font-heading text-base font-bold">LA &amp; SAVVY - Admin</span>
              <span className="hidden rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold text-jungle sm:inline">Admin mode active</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden text-right text-xs text-white/80 md:block">
                {session.name}
                <br />
                {session.isMain ? "Main Admin" : `${session.role} • ${session.zone}`}
              </span>
              <button onClick={logout} className="inline-flex items-center gap-1 rounded-btn bg-maroon px-3 py-2 text-sm font-semibold hover:bg-maroon-600">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          </div>
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
            {NAV.filter((n) => session.isMain || !n.mainOnly).map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn("whitespace-nowrap rounded-btn px-3 py-1.5 text-sm font-semibold", path === n.href ? "bg-gold text-jungle" : "text-white/85 hover:text-gold")}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        {session.demo && (
          <p className="bg-gold-100 px-4 py-1.5 text-center text-[11px] font-medium text-[#6E5630]">Demo mode • Supabase keys will be provided later — data is saved in this browser only</p>
        )}
        <main className="mx-auto max-w-6xl px-4 py-6">
          {denied ? (
            <div className="rounded-card border border-line bg-white p-6 text-center shadow-soft">
              <p className="font-semibold text-maroon">Main Admin only</p>
              <p className="text-sm text-muted">Your account is limited to the {session.zone} zone.</p>
            </div>
          ) : (
            children
          )}
        </main>
        <footer className="py-6 text-center text-xs text-muted">
          {company.footer} • {company.email}
        </footer>
      </div>
    </AdminContext.Provider>
  );
}
