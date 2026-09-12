"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { PublicationEditor } from "./publication-editor";
import { TransactionStatus, type TransactionState } from "@/components/transaction/transaction-status";
import { ExplorerReference } from "@/components/transaction/explorer-reference";
import { NetworkStatus } from "@/components/wallet/network-status";
import { WalletRequired } from "@/components/wallet/wallet-status";
import { completeDemoProof, createDemoPublication, getDraftErrors, metadataDigest, type Draft, type DraftErrors, type DemoPublication } from "@/features/demo/publishing";
import { useDemoSession } from "@/features/demo/use-session";
import { AppError, errorMessage } from "@/lib/web3/errors";
import type { DemoScenario } from "@/lib/web3/types";

const initial: Draft = { title: "", preview: "", body: "", price: "1", durationDays: 30, isGated: true };

function ActiveCreatePublication() {
  const session = useDemoSession();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [review, setReview] = useState(false);
  const [publication, setPublication] = useState<DemoPublication>();
  const [status, setStatus] = useState<TransactionState>("awaiting-confirmation");
  const [scenario, setScenario] = useState<DemoScenario>("success");
  const [error, setError] = useState("");
  const pending = useRef(false);
  const requestId = useRef("");
  const busy = status === "pending";
  const done = Boolean(publication?.proof);
  const requiredChain = publication || !draft.isGated ? 43113 : 133;

  async function publish() {
    if (pending.current) return;
    const validation = getDraftErrors(draft);
    if (Object.keys(validation).length) { setErrors(validation); setReview(false); return; }
    pending.current = true; setError(""); setStatus("pending");
    try {
      requestId.current ||= `demo-${crypto.randomUUID()}`;
      if (!publication) {
        const created = await createDemoPublication(draft, requestId.current, scenario);
        setPublication(created);
        if (created.isGated) { setStatus("confirmed"); return; }
        const completed = await completeDemoProof(created.id, scenario);
        setPublication(completed);
      } else {
        setPublication(await completeDemoProof(publication.id, scenario));
      }
      setStatus("confirmed");
    } catch (cause) { setError(errorMessage(cause)); setStatus(cause instanceof AppError && cause.code === "rejected" ? "rejected" : "failed"); }
    finally { pending.current = false; setScenario("success"); }
  }

  return <div className="space-y-6">
    {!review ? <PublicationEditor draft={draft} errors={errors} onChange={setDraft} onReview={() => {
      const validation = getDraftErrors(draft); setErrors(validation);
      const first = Object.keys(validation)[0];
      if (first) { document.getElementById(first)?.focus(); return; }
      setReview(true); setStatus("awaiting-confirmation");
    }} /> : <section aria-label="Publication review" className="space-y-5 rounded-2xl border border-neutral-800 p-6">
      <h2 className="text-2xl font-semibold text-white">{done ? "Demo publication created" : "Review publication"}</h2>
      <h3 className="text-xl text-white">{draft.title}</h3><p className="whitespace-pre-wrap text-neutral-300">{draft.preview}</p>
      <p className="text-sm text-neutral-400">{draft.isGated ? `${draft.price} DEMO · ${draft.durationDays} days · Members only` : "Public · No membership needed"}</p>
      <details><summary className="flex min-h-11 cursor-pointer items-center text-sm text-neutral-200">Preview public metadata hash</summary><p className="break-all font-mono text-xs text-neutral-400">{metadataDigest(draft)}</p><p className="mt-2 text-sm text-neutral-400">Contains title, description, gated option, price and duration. The article body is excluded.</p></details>
      <ol className="space-y-2 text-sm text-neutral-300"><li>1. HashKey membership: {!draft.isGated ? "not needed for public content" : publication?.lock ? "simulated lock created" : "pending"}</li><li>2. Avalanche Fuji proof: {done ? "simulated proof registered" : "pending"}</li></ol>
      <TransactionStatus state={status} detail={error || (done ? "Simulation completed. No real transaction was sent." : publication ? "Lock preserved. Select Avalanche Fuji, then confirm proof registration." : "Confirm to simulate publication. No wallet signature or real payment.")} reference={publication?.proofTransaction ?? publication?.lockTransaction} />
      {publication?.lock && <ExplorerReference reference={publication.lock} />}{publication?.proof && <ExplorerReference reference={publication.proof} />}
      {done ? <div className="flex flex-wrap gap-4"><Link className="inline-flex min-h-11 items-center text-red-300 underline" href={`/content/${publication!.id}`}>Read publication</Link><Link className="inline-flex min-h-11 items-center text-red-300 underline" href="/dashboard">View Dashboard</Link><Link className="inline-flex min-h-11 items-center text-red-300 underline" href={`/profile/${session.account}`}>Creator profile</Link><Button size="lg" variant="outline" onClick={() => { setDraft(initial); setPublication(undefined); setReview(false); requestId.current = ""; }}>Create another</Button></div> : <>
        <NetworkStatus requiredChain={requiredChain} disabled={busy} />
        <FormField id="publish-scenario" label="Simulation outcome"><select id="publish-scenario" className={inputClassName} disabled={busy} value={scenario} onChange={(e) => setScenario(e.target.value as DemoScenario)}><option value="success">Success</option><option value="reject">Rejected transaction</option>{publication && <option value="proof-error">Proof registration fails</option>}</select></FormField>
        <div className="flex flex-wrap gap-3"><Button size="lg" disabled={busy || session.chainId !== requiredChain || session.networkState === "switching"} onClick={publish}>{busy ? "Transaction pending…" : publication ? "Confirm proof registration" : "Confirm publication"}</Button>{!publication && <Button size="lg" variant="outline" disabled={busy} onClick={() => { setReview(false); setError(""); requestId.current = ""; }}>Edit draft</Button>}</div>
      </>}
    </section>}
  </div>;
}

export function CreatePublication() {
  const session = useDemoSession();
  return <div className="mx-auto max-w-3xl space-y-8"><header className="space-y-3 border-b border-neutral-800 pb-6"><h1 className="text-3xl font-bold text-white">Create Publication</h1><p className="text-neutral-400">Prepare public metadata and fictional content. Development simulations remain in this tab and disappear on reload.</p></header>{process.env.NODE_ENV !== "development" ? <p className="text-neutral-400">Publishing is not available yet. Wallet, SDK and protected storage integration are pending.</p> : session.status !== "connected" || !session.account ? <WalletRequired /> : <ActiveCreatePublication key={session.account} />}</div>;
}
