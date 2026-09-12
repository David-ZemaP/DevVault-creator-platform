"use client";
import { Button } from "@/components/ui/button";
import { networkName } from "@/lib/web3/networks";
import { useDemoSession } from "@/features/demo/use-session";
import { switchDemoNetwork } from "@/features/demo/session";
import { errorMessages } from "@/lib/web3/errors";

export function NetworkStatus({ requiredChain, disabled = false }: { requiredChain: number; disabled?: boolean }) {
  const session = useDemoSession();
  const correct = session.chainId === requiredChain;
  return <div className="space-y-3 rounded-xl border border-neutral-800 p-4">
    <p className="text-sm text-neutral-400">Current: {networkName(session.chainId)}<br />Required: {networkName(requiredChain)}</p>
    <p role="status" className="text-sm text-neutral-300">{session.networkState === "switching" ? "Switching demo network…" : session.networkState === "error" ? "Network switch failed. Retry the simulation." : correct ? "Required network selected" : "Wrong network"}</p>
    {(!correct || session.networkState === "error") && <Button size="lg" variant="outline" disabled={disabled || session.status !== "connected" || session.networkState === "switching"} onClick={() => void switchDemoNetwork(requiredChain)}>{session.networkState === "error" ? "Retry network switch" : `Switch to ${networkName(requiredChain)}`}</Button>}
    {!correct && <p className="text-sm text-neutral-400">{errorMessages["wrong-network"]}</p>}
  </div>;
}
