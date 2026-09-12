import type { WalletAddress } from "@/types/creator";
import type { MembershipOffer, ProofReference } from "@/types/publication";

export type LockReference = Exclude<MembershipOffer["lock"], { status: "pending" }>;
export type RegisteredProof = Exclude<ProofReference, { status: "pending" }>;
export type TransactionReference =
  | { mode: "mock"; id: string; chainId: number }
  | { mode: "chain"; hash: `0x${string}`; chainId: number };

export interface OperationContext {
  account: WalletAddress;
  chainId: number;
  /** Stable across retries, scoped to account and operation by the adapter. */
  requestId: string;
}

export interface CreateLockInput extends OperationContext {
  name: string;
  priceBaseUnits: bigint;
  durationDays: number;
}

export interface MembershipInput {
  account: WalletAddress;
  lock: LockReference;
}

export interface RegisterProofInput extends OperationContext {
  publicationId: string;
  /** Public metadata digest only; the premium body must never be submitted here. */
  metadataHash: `0x${string}`;
}

/** Successful writes resolve after confirmation, never at transaction submission. */
export interface Web3Adapter {
  createMembershipLock(input: CreateLockInput): Promise<{ lock: LockReference; transaction: TransactionReference }>;
  purchaseMembership(input: MembershipInput & OperationContext): Promise<TransactionReference>;
  hasMembership(input: MembershipInput): Promise<boolean>;
  registerContentProof(input: RegisterProofInput): Promise<{ proof: RegisteredProof; transaction: TransactionReference }>;
  getContentProof(publicationId: string): Promise<RegisteredProof | undefined>;
}

export type DemoScenario = "success" | "reject" | "purchase-error" | "proof-error" | "membership-delay" | "read-error";
