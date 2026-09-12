import { defineChain } from "viem";
import { appChains, membershipChain } from "./networks";

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

export const supportedChains = appChains;

export const defaultChain = membershipChain;
