"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

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
                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-600"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
                  >
                    {chain.hasIcon && (
                      <div className="mr-1.5 h-3 w-3 overflow-hidden rounded-full">
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            className="h-3 w-3"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-100 hover:bg-neutral-800"
                  >
                    {account.displayName}
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
