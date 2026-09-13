"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/lib/auth/use-auth";
import { useAuthModal } from "./auth-modal";
import { LogIn, ShieldAlert, ChevronDown } from "lucide-react";
import { formatAddress } from "@/lib/utils";

export function CustomConnectButton() {
  const { openAuthModal } = useAuthModal();
  const auth = useAuth();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openChainModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) {
          return (
            <div
              aria-hidden="true"
              className="h-9 w-24 rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 animate-pulse"
            />
          );
        }

        // Case 1: Wallet is NOT connected
        if (!connected) {
          return (
            <button
              onClick={openAuthModal}
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 active:scale-[0.98] transition-all dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          );
        }

        // Case 2: Wrong network
        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-300 cursor-pointer"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Wrong network</span>
            </button>
          );
        }

        // Case 3: Wallet connected, but NOT session authenticated (or 30m idle expired)
        if (!auth.isSessionAuthenticated) {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={openChainModal}
                type="button"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {chain.hasIcon && chain.iconUrl && (
                  <img
                    alt={chain.name ?? "Chain"}
                    src={chain.iconUrl}
                    className="h-3.5 w-3.5 rounded-full object-cover"
                  />
                )}
                <span>{chain.name}</span>
              </button>

              <button
                onClick={openAuthModal}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-500/20 active:scale-[0.98] transition-all dark:text-amber-300 cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                <span>Authenticate</span>
                <span className="hidden sm:inline text-[11px] font-mono opacity-80">
                  {formatAddress(account.address as `0x${string}`)}
                </span>
              </button>
            </div>
          );
        }

        // Case 4: Fully Connected & Authenticated
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={openChainModal}
              type="button"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {chain.hasIcon && chain.iconUrl && (
                <img
                  alt={chain.name ?? "Chain"}
                  src={chain.iconUrl}
                  className="h-3.5 w-3.5 rounded-full object-cover"
                />
              )}
              <span>{chain.name}</span>
            </button>

            <button
              onClick={openAuthModal}
              type="button"
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer shadow-sm"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm" aria-hidden="true" />
              <span>{account.displayName}</span>
              {account.displayBalance && (
                <span className="text-zinc-400 font-normal border-l border-zinc-200 dark:border-zinc-800 pl-1.5 hidden md:inline">
                  {account.displayBalance}
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
