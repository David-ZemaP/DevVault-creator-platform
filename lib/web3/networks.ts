import { avalancheFuji, hashkeyTestnet } from "@/lib/web3/chains";

/** Testnets only. Dual-chain architecture for Avalanche Fuji & HashKey Testnet. */
export const membershipChain = hashkeyTestnet;
export const proofChain = avalancheFuji;
export const appChains = [membershipChain, proofChain] as const;
export const MEMBERSHIP_CHAIN_ID = 133;
export const PROOF_CHAIN_ID = 43113;

export function networkName(chainId: number): string {
  return appChains.find((chain) => chain.id === chainId)?.name ?? `Unsupported network (${chainId})`;
}
