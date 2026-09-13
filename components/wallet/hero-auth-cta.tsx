"use client";

import { useAuth } from "@/lib/auth/use-auth";
import { useAuthModal } from "./auth-modal";
import { ShieldCheck, LogIn, ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroAuthCTA() {
  const { isWalletConnected, isSessionAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();

  if (isSessionAuthenticated) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
      >
        <span>Open Dashboard</span>
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={openAuthModal}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer"
    >
      {isWalletConnected ? (
        <>
          <ShieldCheck className="h-4 w-4 text-amber-500" />
          <span>Authenticate Session</span>
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
          <span>Sign In / Connect</span>
        </>
      )}
    </button>
  );
}
