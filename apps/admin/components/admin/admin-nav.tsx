"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeDollarSign, CreditCard, LayoutDashboard, Package, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, main: false },
  { href: "/admin/orders", label: "Orders", icon: Package, main: false },
  { href: "/admin/users", label: "Users", icon: Users, main: true },
  { href: "/admin/suppliers", label: "Suppliers", icon: Store, main: true },
  { href: "/admin/pricing", label: "Pricing", icon: BadgeDollarSign, main: true },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, main: true },
];

export function AdminNav({ isMain }: { isMain: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.filter((i) => isMain || !i.main).map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-btn px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-maroon text-white shadow-soft" : "text-jungle hover:bg-mint"
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-gold" : "text-gold-600")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
