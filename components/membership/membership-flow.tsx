"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { LockedContent } from "./locked-content";
import { UnlockedContent } from "@/components/content/unlocked-content";
import { TransactionStatus } from "@/components/transaction/transaction-status";
import { NetworkStatus } from "@/components/wallet/network-status";
import { WalletRequired } from "@/components/wallet/wallet-status";
import { useDemoSession } from "@/features/demo/use-session";
import { createDemoMembershipFlow } from "@/features/demo/membership-runtime";
import type { MembershipOffer, PremiumContent } from "@/types/publication";
import type { DemoScenario } from "@/lib/web3/types";

interface Props { publicationId: string; creatorName: string; membership: MembershipOffer; loadContent?: () => Promise<PremiumContent> }

function ActiveMembershipFlow(props: Props) {
  const session = useDemoSession();
  const [scenario, setScenario] = useState<DemoScenario>("success");
  const [flow] = useState(() => createDemoMembershipFlow(props.publicationId, props.membership, session, props.loadContent));
  const state = useSyncExternalStore(flow.subscribe, flow.getSnapshot, flow.getSnapshot);
  const busy = ["pending", "confirmed", "verifying"].includes(state.stage) || (state.stage === "detected" && !state.content);
  if (state.content) return <div className="mx-auto max-w-3xl space-y-4"><TransactionStatus state="detected" reference={state.transaction} detail="Mock membership verified. No real payment was made." /><UnlockedContent content={state.content} /></div>;
  return <LockedContent {...props}>
    <div className="mt-5 space-y-4">
      <NetworkStatus requiredChain={133} disabled={busy} />
      {state.stage !== "locked" && <TransactionStatus state={state.stage} reference={state.transaction} detail={state.error?.message ?? "Simulation only · No wallet signature or real payment."} />}
      {state.stage === "locked" ? <Button size="lg" className="w-full" disabled={session.chainId !== 133} onClick={flow.confirm}>Subscribe (demo)</Button> : <>
        <FormField id="subscribe-scenario" label="Simulation outcome"><select id="subscribe-scenario" className={inputClassName} disabled={busy} value={scenario} onChange={(e) => setScenario(e.target.value as DemoScenario)}><option value="success">Success</option>{!state.transaction && <><option value="reject">Rejected transaction</option><option value="purchase-error">Failed transaction</option><option value="membership-delay">Membership delayed</option></>}<option value="read-error">Verification read error</option></select></FormField>
        <Button size="lg" className="w-full" disabled={busy || session.chainId !== 133} onClick={() => { void flow.execute(scenario); setScenario("success"); }}>{busy ? "Processing simulation…" : state.transaction ? "Retry verification" : "Confirm transaction"}</Button>
        <Button size="lg" variant="outline" className="w-full" disabled={busy} onClick={flow.cancel}>Cancel</Button>
      </>}
      <p className="text-sm text-neutral-400">Fictional content is requested only after mock membership verification. Reloading clears the demo session.</p>
    </div>
  </LockedContent>;
}

export function MembershipFlow(props: Props) {
  const session = useDemoSession();
  if (process.env.NODE_ENV !== "development") return <LockedContent {...props} />;
  if (!session.account || session.status !== "connected") return <LockedContent {...props}><div className="mt-5"><WalletRequired /></div></LockedContent>;
  return <ActiveMembershipFlow key={`${props.publicationId}:${session.account}:${session.chainId}:${session.revision}`} {...props} />;
}
