"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, PlusCircle, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex min-w-0 items-center gap-1 sm:gap-1.5">
      {navigation.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all",
              isActive
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/25 shadow-sm shadow-blue-500/10"
                : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent",
            )}
          >
            <Icon aria-hidden="true" className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-blue-400" : "text-slate-400")} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
