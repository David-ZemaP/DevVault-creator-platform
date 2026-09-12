import { appChains } from "./networks";
import type { LockReference, RegisteredProof, TransactionReference } from "./types";

export type ExplorerReference = LockReference | RegisteredProof | TransactionReference;
export function describeReference(reference: ExplorerReference): { label: string; value: string; href?: string } {
  if (("mode" in reference && reference.mode === "mock") || ("status" in reference && reference.status === "mock")) {
    return { label: "Simulation ID", value: reference.id };
  }
  const value = "hash" in reference ? reference.hash : "address" in reference ? reference.address : "transactionHash" in reference ? reference.transactionHash : "";
  const isAddress = "address" in reference;
  const valid = isAddress ? /^0x[\da-f]{40}$/i.test(value) : /^0x[\da-f]{64}$/i.test(value);
  const explorer = appChains.find((chain) => chain.id === reference.chainId)?.blockExplorers?.default.url;
  return { label: isAddress ? "Lock address" : "Transaction hash", value, href: valid && explorer ? `${explorer}/${isAddress ? "address" : "tx"}/${value}` : undefined };
}
