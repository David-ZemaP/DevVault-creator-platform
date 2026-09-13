import { HSK_CHAIN_ID, HSK_RPC_URL, HSK_EXPLORER_URL } from "./hsk";
import { defineChain } from "viem";
import { avalanche, hashkey } from "viem/chains";

export const avalancheFuji = defineChain({
  id: 43113,
  name: "Avalanche Fuji",
  nativeCurrency: {
    decimals: 18,
    name: "Avalanche",
    symbol: "AVAX",
  },
  rpcUrls: {
    default: {
      http: [
        "https://api.avax-test.network/ext/bc/C/rpc",
        "https://avalanche-fuji-c-chain-rpc.publicnode.com",
      ],
    },
    public: {
      http: [
        "https://api.avax-test.network/ext/bc/C/rpc",
        "https://avalanche-fuji-c-chain-rpc.publicnode.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "SnowScan",
      url: "https://testnet.snowscan.xyz",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 7096959,
    },
  },
  testnet: true,
});

export const hashkeyTestnet = defineChain({
  id: HSK_CHAIN_ID,
  name: "HashKey Chain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HSK",
    symbol: "HSK",
  },
  rpcUrls: {
    default: {
      http: [HSK_RPC_URL],
    },
    public: {
      http: [HSK_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "HashKey Explorer",
      url: HSK_EXPLORER_URL,
    },
  },
  testnet: true,
});

export { hashkey, avalanche };

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
  avalancheFuji,
  hashkeyTestnet,
  hardhatLocal,
] as const;

/**
 * Dual-Service Chain Workflow:
 * - Content Proof -> Avalanche Fuji (anchors ContentProofRegistry)
 * - Membership -> HashKey Chain / HSK (verifies Unlock Protocol keys)
 */
export const CONTENT_PROOF_CHAIN = avalancheFuji;
export const MEMBERSHIP_CHAIN = hashkeyTestnet;
export const defaultChain = CONTENT_PROOF_CHAIN;

