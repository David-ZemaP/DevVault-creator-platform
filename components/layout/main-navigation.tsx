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
              "flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all",
              isActive
                ? "bg-zinc-100 text-zinc-950 border border-zinc-200 shadow-sm dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200",
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-zinc-950 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
              )}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
