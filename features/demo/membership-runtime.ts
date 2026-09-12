import { createSubscriptionFlow } from "./subscription";
import { loadFictionalContent } from "./premium-action";
import { sessionStillCurrent, type DemoSession } from "./session";
import { demoWeb3, fixtureLock } from "../../lib/web3/demo";
import { AppError } from "../../lib/web3/errors";
import type { MembershipOffer, PremiumContent } from "@/types/publication";
import type { DemoScenario } from "@/lib/web3/types";

/** Composition boundary: wire the SDK and protected-delivery ports here, not in the UI. */
export function createDemoMembershipFlow(publicationId: string, membership: MembershipOffer, session: DemoSession, loadContent?: () => Promise<PremiumContent>) {
  let outcome: DemoScenario = "success";
  let executing = false;
  const adapter = { ...demoWeb3,
    purchaseMembership: (input: Parameters<typeof demoWeb3.purchaseMembership>[0]) => { demoWeb3.setScenario(outcome === "read-error" ? "success" : outcome); return demoWeb3.purchaseMembership(input); },
    hasMembership: (input: Parameters<typeof demoWeb3.hasMembership>[0]) => { demoWeb3.setScenario(outcome === "read-error" ? "read-error" : "success"); return demoWeb3.hasMembership(input); },
  };
  const flow = createSubscriptionFlow(adapter, { load: async (id) => {
    if (loadContent) return loadContent();
    const result = await loadFictionalContent(id);
    if (!result.content) throw new AppError(result.error ?? "backend");
    return result.content;
  } }, { account: session.account!, chainId: session.chainId, lock: membership.lock.status === "pending" ? fixtureLock(publicationId) : membership.lock, publicationId, requestId: `subscribe:${publicationId}:${session.account}` }, () => process.env.NODE_ENV === "development" && sessionStillCurrent(session));
  return { ...flow, async execute(scenario: DemoScenario) {
    if (executing) return;
    executing = true; outcome = scenario;
    try { await flow.execute(); } finally { executing = false; }
  } };
}
