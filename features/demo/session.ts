import { createStore } from "./store";
import { AppError } from "../../lib/web3/errors";
import type { WalletAddress } from "@/types/creator";
import type { WalletSnapshot, WalletPort } from "@/lib/web3/integration";

export const DEMO_ACCOUNT: WalletAddress = "0x1111111111111111111111111111111111111111";
export interface DemoSession extends WalletSnapshot { networkState: "idle" | "switching" | "success" | "error"; revision: number }
const initial: DemoSession = { status: process.env.NODE_ENV === "development" ? "connected" : "disconnected", account: process.env.NODE_ENV === "development" ? DEMO_ACCOUNT : undefined, chainId: 133, networkState: "idle", revision: 0 };
export const demoSession = createStore(initial);
export const getServerSession = () => initial;
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 600));
export function setDemoSession(patch: Partial<DemoSession>) {
  const current = demoSession.getSnapshot();
  demoSession.set({ ...current, ...patch, revision: current.revision + 1 });
}
export function requireDemoSession(requiredChain?: number) {
  const session = demoSession.getSnapshot();
  if (process.env.NODE_ENV !== "development" || session.status !== "connected" || !session.account) throw new AppError("session");
  if (requiredChain && session.chainId !== requiredChain) throw new AppError("wrong-network");
  return { ...session, account: session.account };
}
export function sessionStillCurrent(snapshot: DemoSession): boolean {
  const current = demoSession.getSnapshot();
  return current.revision === snapshot.revision && current.account === snapshot.account && current.status === "connected";
}
export async function connectDemo(reject = false) {
  setDemoSession({ status: "connecting", account: undefined });
  const revision = demoSession.getSnapshot().revision;
  await pause();
  if (demoSession.getSnapshot().revision !== revision) return;
  setDemoSession({ status: reject ? "error" : "connected", account: reject ? undefined : DEMO_ACCOUNT });
}
export async function switchDemoNetwork(chainId: number, fail = false) {
  requireDemoSession();
  setDemoSession({ networkState: "switching" });
  const revision = demoSession.getSnapshot().revision;
  await pause();
  if (demoSession.getSnapshot().revision !== revision) return;
  setDemoSession(fail ? { networkState: "error" } : { chainId, networkState: "success" });
}
export const demoWallet: WalletPort = {
  getSnapshot: demoSession.getSnapshot,
  subscribe: demoSession.subscribe,
  connect: () => connectDemo(),
  disconnect: () => setDemoSession({ status: "disconnected", account: undefined, networkState: "idle" }),
  switchNetwork: (chainId) => switchDemoNetwork(chainId),
};
