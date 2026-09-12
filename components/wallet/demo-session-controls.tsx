"use client";
import { useDemoSession } from "@/features/demo/use-session";
import { connectDemo, demoWallet, setDemoSession, switchDemoNetwork } from "@/features/demo/session";
import { WalletStatus } from "./wallet-status";
import { Button } from "@/components/ui/button";
import { FormField, inputClassName } from "@/components/ui/form-field";

export function DemoSessionControls() {
  const session = useDemoSession();
  if (process.env.NODE_ENV !== "development") return null;
  return <details id="demo-wallet" className="mx-auto max-w-7xl scroll-mt-32 px-4 pb-4 sm:px-6 lg:px-8">
    <summary className="flex min-h-11 cursor-pointer items-center text-sm text-red-300">Demo wallet & network · {session.status} · No real transactions</summary>
    <div className="space-y-4 rounded-xl border border-neutral-800 p-4">
      <WalletStatus session={session} onConnect={() => void connectDemo()} onDisconnect={demoWallet.disconnect} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="demo-network" label="Current demo network"><select id="demo-network" className={inputClassName} disabled={session.networkState === "switching"} value={session.chainId} onChange={(e) => setDemoSession({ chainId: Number(e.target.value), networkState: "idle" })}><option value={133}>HashKey Testnet · Memberships</option><option value={43113}>Avalanche Fuji · Proofs</option><option value={1}>Unsupported network · Error scenario</option></select></FormField>
        <FormField id="demo-account" label="Demo account"><select id="demo-account" className={inputClassName} value={session.account ?? ""} onChange={(e) => setDemoSession(e.target.value ? { account: e.target.value as `0x${string}`, status: "connected" } : { account: undefined, status: "disconnected" })}><option value="">Disconnected</option><option value="0x1111111111111111111111111111111111111111">Valeria · Creator / Subscriber</option><option value="0x2222222222222222222222222222222222222222">Andrés · Second account</option><option value="0x4444444444444444444444444444444444444444">Diego · Empty creator</option></select></FormField>
      </div>
      <div className="flex flex-wrap gap-3"><Button size="lg" variant="outline" disabled={session.status === "connecting"} onClick={() => void connectDemo(true)}>Simulate wallet rejection</Button><Button size="lg" variant="outline" disabled={session.status !== "connected" || session.networkState === "switching"} onClick={() => void switchDemoNetwork(session.chainId === 133 ? 43113 : 133, true)}>Simulate network error</Button></div>
      <p role="status" className="text-sm text-neutral-400">{session.networkState === "switching" ? "Switching demo network…" : session.networkState === "error" ? "Network switch failed. Use the switch button in the current flow to retry." : session.networkState === "success" ? "Demo network switched successfully." : "This session is independent from browser wallet extensions and resets on reload."}</p>
    </div>
  </details>;
}
