import { defineChain } from "viem";
import { avalanche, avalancheFuji } from "viem/chains";

export const hardhatLocal = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
});

export const supportedChains = [avalanche, avalancheFuji, hardhatLocal] as const;

export const defaultChain = process.env.NODE_ENV === "production" ? avalanche : avalancheFuji;
