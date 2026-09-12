"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/purchases", label: "My Purchases", icon: LayoutDashboard },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex min-w-0 gap-1 sm:gap-2">
      {navigation.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors sm:flex-none",
              isActive ? "bg-red-500/10 text-red-400" : "text-neutral-400 hover:bg-neutral-900 hover:text-white",
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
