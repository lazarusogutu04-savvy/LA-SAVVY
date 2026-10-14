import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoLockup } from "./logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/book", label: "Mtaani" },
  { href: "/#savvy", label: "Savvy" },
  { href: "/#about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-jungle text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="LA & Savvy Limited home">
          <LogoLockup />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="text-white/85 transition-colors hover:text-gold">
              {n.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" className="h-10 px-4">
          <Link href="/book">Book an Errand</Link>
        </Button>
      </div>
      <nav className="flex gap-5 overflow-x-auto border-t border-white/10 px-4 py-2 text-sm md:hidden">
        {NAV.map((n) => (
          <Link key={n.label} href={n.href} className="whitespace-nowrap text-white/85">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
