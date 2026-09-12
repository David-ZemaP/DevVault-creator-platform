import assert from "node:assert/strict";
import { createMockWeb3 } from "../lib/web3/adapters/mock";
import { createDemoPublication, completeDemoProof, demoPublications, readAuthorDemo, validateDraft } from "../features/demo/publishing";
import { metadataDigest, getDraftErrors, inspectDemoProof, loadSessionPremium } from "../features/demo/publishing";
import { demoWeb3 } from "../lib/web3/demo";
import { setDemoSession } from "../features/demo/session";
import { createSubscriptionFlow } from "../features/demo/subscription";
import { describeReference } from "../lib/web3/explorers";
import type { Web3Adapter } from "../lib/web3/types";
import { withDeadline } from "../features/demo/deadline";
import { loadFictionalContent } from "../features/demo/premium-action";

async function main() {
  const account = "0x1111111111111111111111111111111111111111" as const;
  let now = 0;
  const adapter = createMockWeb3({ delayMs: 0, now: () => now });
  const input = { account, chainId: 133, requestId: "lock", name: "Demo", priceBaseUnits: 1n, durationDays: 1 };
  await assert.rejects(adapter.createMembershipLock({ ...input, chainId: 43113 }), { code: "wrong-network" });
  adapter.setScenario("reject");
  await assert.rejects(adapter.createMembershipLock(input), { code: "rejected" });
  const [first, duplicate] = await Promise.all([adapter.createMembershipLock(input), adapter.createMembershipLock(input)]);
  assert.deepEqual(first, duplicate, "Concurrent retries must create one lock");
  const purchase = { account, lock: first.lock, chainId: 133, requestId: "purchase" };
  adapter.setScenario("purchase-error");
  await assert.rejects(adapter.purchaseMembership(purchase), { code: "transaction" });
  assert.equal(await adapter.hasMembership(purchase), false);
  adapter.setScenario("membership-delay");
  const transaction = await adapter.purchaseMembership(purchase);
  assert.equal(await adapter.hasMembership(purchase), false);
  assert.equal(await adapter.hasMembership(purchase), true);
  assert.deepEqual(await adapter.purchaseMembership(purchase), transaction);
  assert.equal(await adapter.hasMembership({ ...purchase, account: "0x2222222222222222222222222222222222222222" }), false);
  adapter.setScenario("read-error");
  await assert.rejects(adapter.hasMembership(purchase), { code: "rpc" });
  assert.equal(await adapter.hasMembership(purchase), true);
  now = 86_400_001;
  assert.equal(await adapter.hasMembership(purchase), false, "Expired memberships must lock again");

  const draft = { title: "Demo", preview: "Public summary", body: "Private fictional body", price: "1.25", durationDays: 30, isGated: true };
  assert.ok(validateDraft({ ...draft, title: "  " }));
  assert.ok(validateDraft({ ...draft, price: "1e3" }));
  assert.ok(validateDraft({ ...draft, durationDays: 0 }));
  assert.equal(validateDraft(draft), undefined);
  assert.equal(metadataDigest(draft), metadataDigest({ ...draft, body: "A different premium body" }));
  assert.equal(Object.keys(getDraftErrors({ ...draft, isGated: false, body: "", price: "0", durationDays: 0 })).length, 0);
  assert.equal(describeReference(transaction).href, undefined);
  assert.equal(describeReference(transaction).label, "Simulation ID");
  assert.ok(describeReference({ mode: "chain", chainId: 43113, hash: `0x${"a".repeat(64)}` }).href?.includes("/tx/"));

  // The same controller used by the UI must never deliver premium before verification.
  let purchases = 0;
  let deliveries = 0;
  const controlled = createMockWeb3({ delayMs: 0, seedLocks: [{ lock: first.lock, durationDays: 1 }] });
  const counted: Web3Adapter = { ...controlled, async purchaseMembership(value) { purchases++; return controlled.purchaseMembership(value); } };
  const port = { async load(publicationId: string) { deliveries++; return { publicationId, body: "Verified fictional content", format: "text" as const }; } };
  const flowInput = { ...purchase, publicationId: "article", requestId: "flow" };
  const flow = createSubscriptionFlow(counted, port, flowInput);
  flow.confirm(); assert.equal(flow.getSnapshot().stage, "awaiting-confirmation");
  flow.cancel(); assert.equal(deliveries, 0);
  controlled.setScenario("membership-delay");
  await Promise.all([flow.execute(), flow.execute(), flow.execute()]); assert.equal(flow.getSnapshot().error?.code, "membership-missing"); assert.equal(deliveries, 0); assert.equal(purchases, 1);
  await flow.execute(); assert.equal(purchases, 1); assert.equal(deliveries, 1); assert.ok(flow.getSnapshot().content);
  const wrong = createSubscriptionFlow(counted, port, { ...flowInput, chainId: 1 });
  await wrong.execute(); assert.equal(wrong.getSnapshot().error?.code, "wrong-network"); assert.equal(purchases, 1);
  const disconnected = createSubscriptionFlow(counted, port, flowInput, () => false);
  await disconnected.execute(); assert.equal(disconnected.getSnapshot().error?.code, "session"); assert.equal(deliveries, 1);
  let active = true;
  const interrupted = createSubscriptionFlow(counted, port, { ...flowInput, requestId: "interrupted" }, () => active);
  const inFlight = interrupted.execute(); active = false; await inFlight;
  assert.equal(interrupted.getSnapshot().error?.code, "session"); assert.equal(deliveries, 1);
  await assert.rejects(withDeadline(new Promise<never>(() => {}), 1), { code: "rpc" });
  for (const scenario of ["reject", "purchase-error", "read-error"] as const) {
    const instance = createMockWeb3({ delayMs: 0, seedLocks: [{ lock: first.lock, durationDays: 1 }] });
    instance.setScenario(scenario);
    const failed = createSubscriptionFlow(instance, port, flowInput);
    await failed.execute(); assert.equal(failed.getSnapshot().content, undefined);
    assert.equal(failed.getSnapshot().stage, scenario === "reject" ? "rejected" : "failed");
    await failed.execute(); assert.ok(failed.getSnapshot().content);
  }
  if (process.env.NODE_ENV !== "development") {
    await assert.rejects(createDemoPublication(draft, "blocked", "success"), { code: "access-denied" });
    assert.deepEqual(await loadFictionalContent("membership-experiences"), { error: "access-denied" });
    console.log("PASS: adapter retries, isolation, expiry, validation, production publishing denied");
    return;
  }
  const publication = await createDemoPublication(draft, "publish", "success");
  await assert.rejects(completeDemoProof(publication.id, "success"), { code: "wrong-network" });
  setDemoSession({ chainId: 43113 });
  await assert.rejects(completeDemoProof(publication.id, "proof-error"), { code: "transaction" });
  assert.deepEqual(demoPublications.getSnapshot()[0].lock, publication.lock);
  assert.equal(demoPublications.getSnapshot()[0].proof, undefined);
  const completed = await completeDemoProof(publication.id, "success");
  assert.equal(completed.proof?.status, "mock");
  assert.deepEqual(await completeDemoProof(publication.id, "success"), completed);
  assert.equal(demoPublications.getSnapshot().length, 1);
  assert.equal(JSON.stringify(demoPublications.getSnapshot()).includes(draft.body), false);
  assert.equal(readAuthorDemo(publication.id), draft.body);
  setDemoSession({ chainId: 133 });
  await assert.rejects(loadSessionPremium(publication.id), { code: "access-denied" });
  await demoWeb3.purchaseMembership({ account, chainId: 133, requestId: "read-created", lock: publication.lock! });
  assert.equal((await loadSessionPremium(publication.id)).body, draft.body);
  setDemoSession({ account: "0x2222222222222222222222222222222222222222" });
  await assert.rejects(loadSessionPremium(publication.id), { code: "access-denied" });
  assert.throws(() => readAuthorDemo(publication.id), { code: "access-denied" });
  setDemoSession({ account, chainId: 43113 });
  assert.deepEqual(await inspectDemoProof(publication.id), completed.proof);
  await assert.rejects(inspectDemoProof("missing"), { code: "proof-missing" });
  const publicPost = await createDemoPublication({ ...draft, isGated: false, body: "", price: "0", durationDays: 0 }, "public", "success");
  assert.equal(publicPost.lock, undefined);
  assert.ok((await completeDemoProof(publicPost.id, "success")).proof);
  setDemoSession({ account: undefined, status: "disconnected" });
  await assert.rejects(createDemoPublication(draft, "disconnected", "success"), { code: "session" });
  console.log("PASS: adapter retries, isolation, expiry, draft validation, proof recovery, body separation");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
