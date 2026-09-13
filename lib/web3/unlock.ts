import { createPublicClient, http } from "viem";
import { MEMBERSHIP_CHAIN, hashkey, hashkeyTestnet, avalanche, avalancheFuji } from "@/lib/web3/chains";
import { UNLOCK_HASHKEY_LOCK_ABI } from "@/lib/web3/hashkey";

export const UNLOCK_PUBLIC_LOCK_ABI = UNLOCK_HASHKEY_LOCK_ABI;

export interface CheckUnlockMembershipParams {
  lockAddress: `0x${string}`;
  userAddress: `0x${string}`;
  chainId?: number;
  abi?: any;
  rpcUrl?: string;
}

/**
 * Checks if a user has a valid membership key.
 * By default, queries the Lock contract deployed on HashKey Chain (HSK)
 * using the ABI provided by the unlock-hashkey service.
 */
export async function checkUnlockMembership(
  params: CheckUnlockMembershipParams
): Promise<boolean> {
  const getTargetChain = (id?: number) => {
    switch (id) {
      case hashkey.id:
        return hashkey;
      case hashkeyTestnet.id:
        return hashkeyTestnet;
      case avalanche.id:
        return avalanche;
      case avalancheFuji.id:
        return avalancheFuji;
      default:
        return MEMBERSHIP_CHAIN;
    }
  };

  const chain = getTargetChain(params.chainId);
  const client = createPublicClient({
    chain,
    transport: params.rpcUrl ? http(params.rpcUrl) : http(),
  });

  const lockAbi = params.abi || UNLOCK_HASHKEY_LOCK_ABI;

  try {
    const hasValidKey = await client.readContract({
      address: params.lockAddress,
      abi: lockAbi,
      functionName: "getHasValidKey",
      args: [params.userAddress],
    });
    return Boolean(hasValidKey);
  } catch (error) {
    console.error("Failed to verify Unlock membership on HashKey Chain:", error);
    return false;
  }
}

export function getUnlockCheckoutUrl(params: {
  lockAddress: string;
  name: string;
  redirectUri?: string;
  chainId?: number;
}): string {
  const chainId = params.chainId || MEMBERSHIP_CHAIN.id;
  const paywallConfig = {
    network: chainId,
    locks: {
      [params.lockAddress]: {
        name: params.name,
        network: chainId,
      },
    },
    pessimistic: true,
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(paywallConfig));
  const redirect = params.redirectUri ? `&redirectUri=${encodeURIComponent(params.redirectUri)}` : "";
  return `https://app.unlock-protocol.com/checkout?paywallConfig=${encodedConfig}${redirect}`;
}

