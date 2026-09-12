import { CheckCircle2, LoaderCircle, AlertCircle, Clock3 } from "lucide-react";
import { ExplorerReference } from "./explorer-reference";
import type { TransactionReference } from "@/lib/web3/types";

export type TransactionState = "awaiting-confirmation" | "pending" | "confirmed" | "rejected" | "failed" | "verifying" | "detected";
const labels: Record<TransactionState, string> = {
  "awaiting-confirmation": "Awaiting confirmation", pending: "Transaction pending", confirmed: "Transaction confirmed",
  rejected: "Transaction rejected", failed: "Operation failed", verifying: "Verifying membership", detected: "Membership detected",
};
export function TransactionStatus({ state, detail, reference }: { state: TransactionState; detail?: string; reference?: TransactionReference }) {
  const busy = state === "pending" || state === "verifying";
  const failed = state === "failed" || state === "rejected";
  const Icon = busy ? LoaderCircle : failed ? AlertCircle : state === "awaiting-confirmation" ? Clock3 : CheckCircle2;
  return <div className="space-y-3 rounded-xl border border-neutral-700 bg-neutral-950/60 p-4">
    <div role={failed ? "alert" : "status"} className="flex items-start gap-3">
      <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${busy ? "motion-safe:animate-spin text-neutral-300" : failed ? "text-red-300" : "text-emerald-300"}`} />
      <div className="min-w-0"><p className="text-sm font-semibold text-white">{labels[state]}</p>{detail && <p className="mt-1 text-sm leading-relaxed text-neutral-400">{detail}</p>}</div>
    </div>
    {reference && <ExplorerReference reference={reference} />}
  </div>;
}
