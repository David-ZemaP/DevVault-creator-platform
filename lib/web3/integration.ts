import type { WalletAddress } from "@/types/creator";
import type { PremiumContent } from "@/types/publication";

export type WalletState = "disconnected" | "connecting" | "connected" | "wrong-network" | "error";
export interface WalletSnapshot { status: WalletState; account?: WalletAddress; chainId: number }
/** Implemented by the wallet owner; the UI does not choose a connector or send RPC requests. */
export interface WalletPort {
  getSnapshot(): WalletSnapshot;
  subscribe(listener: () => void): () => void;
  connect(): Promise<void>;
  disconnect(): void;
  switchNetwork(chainId: number): Promise<void>;
}
/** Backend owner must authenticate the session and verify membership server-side. */
export interface PremiumContentPort {
  load(publicationId: string, account: WalletAddress): Promise<PremiumContent>;
}
