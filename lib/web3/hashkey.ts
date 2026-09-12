import { hashkey, hashkeyTestnet } from "viem/chains";

export const HASHKEY_CONFIG = {
  mainnet: {
    ...hashkey,
    explorerUrl: "https://hashkey.blockscout.com",
    rpcUrl: process.env.NEXT_PUBLIC_HSK_RPC_URL || hashkey.rpcUrls.default.http[0],
  },
  testnet: {
    ...hashkeyTestnet,
    explorerUrl: "https://testnet-explorer.hsk.xyz",
    rpcUrl: process.env.NEXT_PUBLIC_HSK_TESTNET_RPC_URL || hashkeyTestnet.rpcUrls.default.http[0],
  },
};

/**
 * ABI interface received from `unlock-hashkey` repository/microservice.
 * This corresponds to the Unlock Protocol PublicLock interface deployed on HashKey Chain.
 */
export const UNLOCK_HASHKEY_LOCK_ABI = [
  {
    inputs: [{ internalType: "address", name: "_keyOwner", type: "address" }],
    name: "getHasValidKey",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_keyOwner", type: "address" }],
    name: "keyExpirationTimestampFor",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "keyPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_recipient", type: "address" }],
    name: "purchase",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_recipient", type: "address" },
      { internalType: "uint256", name: "_duration", type: "uint256" }
    ],
    name: "grantKey",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const DEFAULT_HSK_LOCK_ADDRESS = (process.env.NEXT_PUBLIC_UNLOCK_HSK_LOCK_ADDRESS ||
  process.env.NEXT_PUBLIC_UNLOCK_LOCK_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export function getHskExplorerAddressUrl(address: string, isTestnet = true): string {
  const base = isTestnet ? HASHKEY_CONFIG.testnet.explorerUrl : HASHKEY_CONFIG.mainnet.explorerUrl;
  return `${base}/address/${address}`;
}

export function getHskExplorerTxUrl(txHash: string, isTestnet = true): string {
  const base = isTestnet ? HASHKEY_CONFIG.testnet.explorerUrl : HASHKEY_CONFIG.mainnet.explorerUrl;
  return `${base}/tx/${txHash}`;
}
