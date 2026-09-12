"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { completeDemoProof, inspectDemoProof, type DemoPublication } from "@/features/demo/publishing";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/web3/errors";
import { ExplorerReference } from "@/components/transaction/explorer-reference";
import { NetworkStatus } from "@/components/wallet/network-status";
import { TransactionStatus } from "@/components/transaction/transaction-status";
import { useDemoSession } from "@/features/demo/use-session";
import type { RegisteredProof } from "@/lib/web3/types";

export function DemoPublicationCard({ publication }: { publication: DemoPublication }) {
  const session = useDemoSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lookedUp, setLookedUp] = useState<RegisteredProof>();
  const pending = useRef(false);
  const owner = session.account === publication.creatorAddress && session.status === "connected";
  async function perform(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try { await action(); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); pending.current = false; }
  }
  return <article className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
    <h3 className="text-xl font-semibold text-white"><Link className="hover:text-red-300" href={`/content/${publication.id}`}>{publication.title}</Link></h3>
    <p className="whitespace-pre-wrap text-neutral-300">{publication.preview}</p>
    <p className="text-sm text-neutral-400">{publication.isGated ? `${publication.price} DEMO · ${publication.durationDays} days` : "Public · Free"}</p>
    <p className="text-sm text-neutral-300">{publication.proof ? "Published in this demo" : "Publication incomplete · Proof pending"}</p>
    {publication.lock && <ExplorerReference reference={publication.lock} />}{publication.proof && <ExplorerReference reference={publication.proof} />}
    {!publication.proof && owner && <><NetworkStatus requiredChain={43113} disabled={busy} /><Button size="lg" disabled={busy || session.chainId !== 43113} onClick={() => void perform(async () => { await completeDemoProof(publication.id, "success"); })}>Retry proof only</Button></>}
    {busy && <TransactionStatus state="pending" detail="Simulating proof operation…" />}
    {error && <TransactionStatus state="failed" detail={error} />}
    <details><summary className="flex min-h-11 cursor-pointer items-center text-sm text-neutral-200">Inspect proof</summary><div className="space-y-3"><p className="break-all font-mono text-xs text-neutral-400">Metadata digest: {publication.metadataHash}</p><div className="flex flex-wrap gap-3"><Button size="lg" variant="outline" disabled={busy} onClick={() => void perform(async () => { setLookedUp(await inspectDemoProof(publication.id)); })}>Look up proof</Button><Button size="lg" variant="outline" disabled={busy} onClick={() => void perform(async () => { setLookedUp(undefined); await inspectDemoProof(publication.id, true); })}>Simulate read error</Button></div>{lookedUp && <ExplorerReference reference={lookedUp} />}</div></details>
    <Link className="inline-flex min-h-11 items-center text-sm text-red-300 underline" href={`/content/${publication.id}`}>Open content</Link>
  </article>;
}
