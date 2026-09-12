import type { Web3Adapter, LockReference, TransactionReference } from "@/lib/web3/types";
import type { PremiumContentPort } from "@/lib/web3/integration";
import type { PremiumContent } from "@/types/publication";
import type { WalletAddress } from "@/types/creator";
import { AppError } from "../../lib/web3/errors";
import { withDeadline } from "./deadline";

export type SubscriptionStage = "locked" | "awaiting-confirmation" | "pending" | "confirmed" | "verifying" | "detected" | "rejected" | "failed";
export interface SubscriptionState { stage: SubscriptionStage; transaction?: TransactionReference; error?: AppError; content?: PremiumContent }

/** SDK-independent workflow; a confirmed purchase is preserved when verification fails. */
export function createSubscriptionFlow(adapter: Web3Adapter, contentPort: PremiumContentPort, input: { account: WalletAddress; chainId: number; lock: LockReference; publicationId: string; requestId: string }, isCurrent: () => boolean = () => true) {
  let state: SubscriptionState = { stage: "locked" };
  let running = false;
  const listeners = new Set<() => void>();
  const set = (patch: Partial<SubscriptionState>) => { state = { ...state, ...patch }; listeners.forEach((listener) => listener()); };
  const guard = () => { if (!isCurrent()) throw new AppError("session"); };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    confirm() { if (!running) set({ stage: "awaiting-confirmation", error: undefined, content: undefined }); },
    cancel() { if (!running) set({ stage: "locked", error: undefined, content: undefined }); },
    async execute() {
      if (running || state.content) return;
      running = true;
      try {
        guard();
        if (input.chainId !== input.lock.chainId || input.chainId !== 133) throw new AppError("wrong-network");
        if (!state.transaction) {
          set({ stage: "pending", error: undefined });
          const transaction = await withDeadline(adapter.purchaseMembership(input));
          guard(); set({ stage: "confirmed", transaction });
        }
        set({ stage: "verifying", error: undefined });
        const detected = await withDeadline(adapter.hasMembership(input));
        guard();
        if (!detected) throw new AppError("membership-missing");
        set({ stage: "detected" });
        // The backend port is deliberately invoked only after successful verification.
        const content = await withDeadline(contentPort.load(input.publicationId, input.account));
        guard(); set({ content });
      } catch (cause) {
        const error = cause instanceof AppError ? cause : new AppError("backend");
        set({ stage: error.code === "rejected" ? "rejected" : "failed", error, content: undefined });
      } finally { running = false; }
    },
  };
}
