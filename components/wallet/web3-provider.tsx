"use client";

import React, { useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  rabbyWallet,
  phantomWallet,
  rainbowWallet,
  okxWallet,
  trustWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { avalancheFuji, hashkeyTestnet } from "@/lib/web3/chains";

// Use developer-configured project ID or demo fallback ID for local/preview development
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "3fbb6bba6f1de962d911bb5b5c9dba88";

const config = getDefaultConfig({
  appName: "DevVault Creator Platform",
  projectId,
  wallets: [
    {
      groupName: "Popular Wallets",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        rabbyWallet,
        phantomWallet,
      ],
    },
    {
      groupName: "More Wallets",
      wallets: [
        rainbowWallet,
        okxWallet,
        trustWallet,
        injectedWallet,
      ],
    },
  ],
  chains: [hashkeyTestnet, avalancheFuji],
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
