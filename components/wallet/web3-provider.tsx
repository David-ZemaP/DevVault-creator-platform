"use client";

import React, { useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { appChains } from "@/lib/web3/networks";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const config = getDefaultConfig({
  appName: "DevVault Creator Platform",
  projectId: projectId || "local-preview",
  // The existing wallet UI remains usable without a WalletConnect credential.
  // An injected-only connector never sends this placeholder to WalletConnect.
  wallets: projectId ? undefined : [{ groupName: "Browser wallet", wallets: [injectedWallet] }],
  chains: appChains,
  ssr: true,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#E84142",
            accentColorForeground: "white",
            borderRadius: "medium",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
