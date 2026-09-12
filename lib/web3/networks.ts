import { avalancheFuji, hashkeyTestnet } from "viem/chains";

/** Testnets only. Deployment choice must be confirmed with Persona 2 before using the SDK. */
export const membershipChain = hashkeyTestnet;
export const proofChain = avalancheFuji;
export const appChains = [membershipChain, proofChain] as const;
export const MEMBERSHIP_CHAIN_ID = 133;
export const PROOF_CHAIN_ID = 43113;

export function networkName(chainId: number): string {
  return appChains.find((chain) => chain.id === chainId)?.name ?? `Unsupported network (${chainId})`;
}
