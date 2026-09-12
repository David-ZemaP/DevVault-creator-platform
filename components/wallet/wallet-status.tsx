import { Button } from "@/components/ui/button";
import type { WalletSnapshot } from "@/lib/web3/integration";
import { formatAddress } from "@/lib/utils";
import { errorMessages } from "@/lib/web3/errors";

export function WalletStatus({ session, onConnect, onDisconnect }: { session: WalletSnapshot; onConnect?: () => void; onDisconnect?: () => void }) {
  return <div className="flex flex-wrap items-center gap-3">
    <p role="status" className="text-sm text-neutral-300">{session.status === "connecting" ? "Connecting demo wallet…" : session.status === "wrong-network" ? "Wallet connected · Wrong network" : session.status === "error" ? "Wallet connection rejected. Retry when ready." : session.account ? `Demo account · ${formatAddress(session.account)}` : "Wallet disconnected · Wallet required"}</p>
    {session.account ? <Button size="lg" variant="outline" onClick={onDisconnect}>Disconnect demo</Button> : <Button size="lg" disabled={!onConnect || session.status === "connecting"} onClick={onConnect}>{session.status === "error" ? "Retry demo connection" : "Use demo account"}</Button>}
  </div>;
}
export function WalletRequired() {
  return <div role="status" className="rounded-xl border border-neutral-700 p-5"><h2 className="text-lg font-semibold text-white">Wallet required</h2><p className="mt-2 text-sm text-neutral-400">{process.env.NODE_ENV === "development" ? errorMessages.session : "Creator access awaits wallet and backend integration. Development simulations are disabled here."}</p></div>;
}
