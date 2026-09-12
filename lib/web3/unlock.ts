import { createPublicClient, http } from "viem";
import { avalanche, avalancheFuji } from "viem/chains";

export const UNLOCK_PUBLIC_LOCK_ABI = [
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
] as const;

export async function checkUnlockMembership(params: {
  lockAddress: `0x${string}`;
  userAddress: `0x${string}`;
  chainId?: number;
}): Promise<boolean> {
  const chain = params.chainId === avalanche.id ? avalanche : avalancheFuji;
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  try {
    const hasValidKey = await client.readContract({
      address: params.lockAddress,
      abi: UNLOCK_PUBLIC_LOCK_ABI,
      functionName: "getHasValidKey",
      args: [params.userAddress],
    });
    return Boolean(hasValidKey);
  } catch (error) {
    console.error("Failed to verify Unlock membership:", error);
    return false;
  }
}

export function getUnlockCheckoutUrl(params: {
  lockAddress: string;
  name: string;
  redirectUri?: string;
}): string {
  const paywallConfig = {
    locks: {
      [params.lockAddress]: {
        name: params.name,
      },
    },
    pessimistic: true,
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(paywallConfig));
  const redirect = params.redirectUri ? `&redirectUri=${encodeURIComponent(params.redirectUri)}` : "";
  return `https://app.unlock-protocol.com/checkout?paywallConfig=${encodedConfig}${redirect}`;
}
