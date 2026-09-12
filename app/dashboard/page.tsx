"use client";
import Link from "next/link";
import { useDemoSession } from "@/features/demo/use-session";
import { CreatorCollection } from "@/components/content/creator-collection";
import { WalletRequired } from "@/components/wallet/wallet-status";

export default function DashboardPage() {
  const session = useDemoSession();
  return <div className="space-y-8"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-6"><div><h1 className="text-3xl font-bold text-white">Creator Dashboard</h1><p className="mt-2 text-neutral-400">Manage publishing simulations, locks and proofs.</p></div><Link className="inline-flex min-h-11 items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700" href="/create">New publication</Link></header>{process.env.NODE_ENV !== "development" || session.status !== "connected" || !session.account ? <WalletRequired /> : <><Link className="inline-flex min-h-11 items-center text-red-300 underline" href={`/profile/${session.account}`}>View creator profile</Link><CreatorCollection key={session.account} address={session.account} showScenarios /></>}</div>;
}
