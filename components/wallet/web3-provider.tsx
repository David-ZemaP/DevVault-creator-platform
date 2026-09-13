"use client";

import { AuthProvider } from "@/lib/auth/use-auth";
import { AuthModalProvider } from "./auth-modal";
import { ConfirmProvider } from "@/components/ui/confirm-modal";
import React, { useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
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
import { useTheme } from "@/components/theme/theme-provider";

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

function RainbowKitThemedWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <RainbowKitProvider
      theme={
        theme === "dark"
          ? darkTheme({
              accentColor: "#ffffff",
              accentColorForeground: "#09090b",
              borderRadius: "medium",
              overlayBlur: "small",
            })
          : lightTheme({
              accentColor: "#09090b",
              accentColorForeground: "#ffffff",
              borderRadius: "medium",
              overlayBlur: "small",
            })
      }
    >
      <AuthProvider>
        <AuthModalProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </AuthModalProvider>
      </AuthProvider>
    </RainbowKitProvider>
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitThemedWrapper>{children}</RainbowKitThemedWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
