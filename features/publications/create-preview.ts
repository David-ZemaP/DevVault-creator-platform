import { keccak256, stringToHex } from "viem";

/** Preserves the existing draft preview. This does not publish or register a proof. */
export async function createPublicationPreview(content: string): Promise<`0x${string}`> {
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  return keccak256(stringToHex(content));
}
