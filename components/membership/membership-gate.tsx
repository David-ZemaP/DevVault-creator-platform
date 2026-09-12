import type { ReactNode } from "react";
import { TransactionStatus } from "@/components/transaction/transaction-status";

/** Presentation only. Parents must fetch premium only after trusted authorization. */
export function MembershipGate({ isGated, verified = false, loading = false, children }: { isGated: boolean; verified?: boolean; loading?: boolean; children: ReactNode }) {
  if (loading) return <TransactionStatus state="verifying" />;
  if (!isGated || verified) return <>{children}</>;
  return <p role="status" className="rounded-xl border border-neutral-800 p-6 text-neutral-300">Members-only content · Verification required</p>;
}
