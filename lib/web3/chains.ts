import { defineChain } from "viem";
import { avalanche, avalancheFuji, hashkey, hashkeyTestnet } from "viem/chains";

export { hashkey, hashkeyTestnet, avalanche, avalancheFuji };

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

export const supportedChains = [
  avalanche,
  avalancheFuji,
  hashkey,
  hashkeyTestnet,
  hardhatLocal,
] as const;

/**
 * Dual-Service Chain Workflow:
 * - Content Proof -> Avalanche Fuji (anchors ContentProofRegistry)
 * - Membership -> HashKey Chain / HSK (verifies Unlock Protocol keys)
 */
export const CONTENT_PROOF_CHAIN = process.env.NODE_ENV === "production" ? avalanche : avalancheFuji;
export const MEMBERSHIP_CHAIN = process.env.NODE_ENV === "production" ? hashkey : hashkeyTestnet;
export const defaultChain = CONTENT_PROOF_CHAIN;

