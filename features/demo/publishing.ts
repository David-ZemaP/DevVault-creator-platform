import { keccak256, parseUnits, stringToHex } from "viem";
import { demoWeb3 as adapter } from "../../lib/web3/demo";
import type { DemoScenario, LockReference, RegisteredProof, TransactionReference } from "@/lib/web3/types";
import { createStore } from "./store";
import { AppError } from "../../lib/web3/errors";
import { requireDemoSession } from "./session";
import type { WalletAddress } from "@/types/creator";
import type { PremiumContent } from "@/types/publication";

export interface Draft { title: string; preview: string; body: string; price: string; durationDays: number; isGated: boolean }
export type DraftErrors = Partial<Record<keyof Draft, string>>;
export interface DemoPublication {
  id: string;
  title: string;
  preview: string;
  price: string;
  durationDays: number;
  isGated: boolean;
  creatorAddress: WalletAddress;
  metadataHash: `0x${string}`;
  lock?: LockReference;
  lockTransaction?: TransactionReference;
  proof?: RegisteredProof;
  proofTransaction?: TransactionReference;
}
const empty: readonly DemoPublication[] = [];
export const demoPublications = createStore(empty);
export const getServerPublications = () => empty;
// Author-entered fictional bodies remain separate from public metadata, in this tab only.
const bodies = new Map<string, string>();

export function getDraftErrors(draft: Draft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.title.trim() || draft.title.length > 120) errors.title = "Enter a title of 1–120 characters.";
  if (!draft.preview.trim() || draft.preview.length > 500) errors.preview = "Enter a public description of 1–500 characters.";
  if ((draft.isGated && !draft.body.trim()) || draft.body.length > 50000) errors.body = "Enter fictional content of 1–50,000 characters for a gated publication.";
  if (draft.isGated && (!/^\d{1,9}(\.\d{1,6})?$/.test(draft.price) || Number(draft.price) <= 0)) errors.price = "Enter a positive demo price with up to 6 decimal places.";
  if (draft.isGated && (!Number.isInteger(draft.durationDays) || draft.durationDays < 1 || draft.durationDays > 365)) errors.durationDays = "Choose a duration between 1 and 365 days.";
  return errors;
}
export function validateDraft(draft: Draft): string | undefined { return Object.values(getDraftErrors(draft))[0]; }
export function publicMetadata(draft: Draft) { return { title: draft.title.trim(), preview: draft.preview.trim(), price: draft.isGated ? draft.price : "0", durationDays: draft.isGated ? draft.durationDays : 0, isGated: draft.isGated }; }
export function metadataDigest(draft: Draft) { return keccak256(stringToHex(JSON.stringify(publicMetadata(draft)))); }

function requireDevelopment() {
  if (process.env.NODE_ENV !== "development") throw new AppError("access-denied", "Demo publishing is available only in development.");
}

export async function createDemoPublication(draft: Draft, requestId: string, scenario: DemoScenario): Promise<DemoPublication> {
  requireDevelopment();
  const error = validateDraft(draft);
  if (error) throw new AppError("invalid-input", error);
  const session = requireDemoSession(draft.isGated ? 133 : 43113);
  const existing = demoPublications.getSnapshot().find((item) => item.id === requestId);
  if (existing) {
    if (existing.creatorAddress !== session.account) throw new AppError("session");
    return existing;
  }
  adapter.setScenario(scenario);
  const created = draft.isGated ? await adapter.createMembershipLock({ account: session.account, chainId: session.chainId, requestId, name: draft.title.trim(), priceBaseUnits: parseUnits(draft.price, 6), durationDays: draft.durationDays }) : undefined;
  const publication: DemoPublication = { ...publicMetadata(draft), id: requestId, creatorAddress: session.account, lock: created?.lock, lockTransaction: created?.transaction, metadataHash: metadataDigest(draft) };
  bodies.set(requestId, draft.body);
  demoPublications.set([...demoPublications.getSnapshot().filter((item) => item.id !== requestId), publication]);
  return publication;
}

export async function completeDemoProof(id: string, scenario: DemoScenario): Promise<DemoPublication> {
  requireDevelopment();
  const session = requireDemoSession(43113);
  const publication = demoPublications.getSnapshot().find((item) => item.id === id);
  if (!publication) throw new AppError("invalid-input", "This demo has expired. Create a new publication.");
  if (publication.creatorAddress !== session.account) throw new AppError("session");
  if (publication.proof) return publication;
  adapter.setScenario(scenario);
  const { proof, transaction } = await adapter.registerContentProof({ account: session.account, chainId: session.chainId, requestId: id, publicationId: id, metadataHash: publication.metadataHash });
  const completed = { ...publication, proof, proofTransaction: transaction };
  demoPublications.set(demoPublications.getSnapshot().map((item) => item.id === id ? completed : item));
  return completed;
}

export function readAuthorDemo(id: string): string | undefined {
  requireDevelopment();
  const publication = demoPublications.getSnapshot().find((item) => item.id === id);
  if (!publication) throw new AppError("session");
  if (publication.isGated && requireDemoSession().account !== publication.creatorAddress) throw new AppError("access-denied");
  return bodies.get(id);
}

/** Local demo content port: verifies through the adapter independently of React state. */
export async function loadSessionPremium(id: string): Promise<PremiumContent> {
  const session = requireDemoSession(133);
  const publication = demoPublications.getSnapshot().find((item) => item.id === id);
  if (!publication?.proof || !publication.lock) throw new AppError("access-denied");
  if (!await adapter.hasMembership({ account: session.account, lock: publication.lock })) throw new AppError("access-denied");
  const body = bodies.get(id);
  if (body === undefined) throw new AppError("session");
  return { publicationId: id, body, format: "text" };
}

export async function inspectDemoProof(id: string, fail = false) {
  requireDevelopment();
  adapter.setScenario(fail ? "read-error" : "success");
  const proof = await adapter.getContentProof(id);
  if (!proof) throw new AppError("proof-missing");
  return proof;
}
