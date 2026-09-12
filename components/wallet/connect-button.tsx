"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

export function CustomConnectButton() {
  return (
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-500 active:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20"
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
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-sm transition-all hover:border-slate-700 hover:bg-slate-800/80 hover:text-white"
                  >
                    {chain.hasIcon && (
                      <div className="h-3.5 w-3.5 overflow-hidden rounded-full ring-1 ring-slate-700/60">
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
                    className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-sm transition-all hover:border-slate-700 hover:bg-slate-800/80 hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                    <span>{account.displayName}</span>
                    {account.displayBalance && (
                      <span className="text-slate-400 font-normal border-l border-slate-800 pl-1.5 hidden sm:inline">
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
  );
}
