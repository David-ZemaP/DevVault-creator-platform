"use client";

import { AuthControls } from "./auth-controls";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

export function CustomConnectButton() {
  return (
    <>
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white px-3.5 py-1.5 text-xs sm:text-sm font-medium shadow-sm hover:bg-zinc-800 active:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 transition-colors"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Connect Wallet</span>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-300 transition-colors hover:bg-amber-500/20"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Wrong network</span>
                  </button>
                );
              }

              return (
                <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850 dark:hover:text-white"
                  >
                    {chain.hasIcon && (
                      <div className="h-3.5 w-3.5 overflow-hidden rounded-full ring-1 ring-zinc-300 dark:ring-zinc-700">
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            className="h-3.5 w-3.5 object-cover"
                          />
                        )}
                      </div>
                    )}
                    <span>{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>{account.displayName}</span>
                    {account.displayBalance && (
                      <span className="text-zinc-400 font-normal border-l border-zinc-200 dark:border-zinc-800 pl-1.5 hidden sm:inline">
                        {account.displayBalance}
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
    <AuthControls />
    </>
  );
}
