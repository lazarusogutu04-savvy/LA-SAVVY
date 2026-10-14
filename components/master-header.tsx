"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

/** Client header on every customer page: logo + Book + Track + Log out (maroon). */
export function MasterHeader() {
  const path = usePathname();
  const router = useRouter();
  const nav = [
    { href: "/book", label: "Book" },
    { href: "/track", label: "Track" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-jungle text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-2 px-4">
        <Link href="/book" className="flex items-center gap-2" aria-label="LA & Savvy home">
          <LogoMark size={38} />
          <span className="leading-tight">
            <span className="block font-heading text-[13px] font-bold tracking-wide text-gold">LA &amp; SAVVY</span>
            <span className="block text-[11px] text-white/80">Mtaani Errands</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-btn px-3 py-2 text-sm font-semibold transition-colors",
                path.startsWith(n.href) ? "bg-gold text-jungle" : "text-white/90 hover:text-gold"
              )}
            >
              {n.label}
            </Link>
          ))}
          <button
            onClick={async () => {
              await signOut();
              router.replace("/auth");
            }}
            className="ml-1 inline-flex items-center gap-1 rounded-btn bg-maroon px-3 py-2 text-sm font-semibold text-white hover:bg-maroon-600"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
