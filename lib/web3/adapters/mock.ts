import type { WalletAddress } from "@/types/creator";
import type { CreateLockInput, DemoScenario, LockReference, MembershipInput, OperationContext, RegisteredProof, RegisterProofInput, TransactionReference, Web3Adapter } from "../types";
import { AppError } from "../errors";

interface MockOptions {
  delayMs?: number;
  now?: () => number;
  seedLocks?: readonly { lock: LockReference; durationDays: number }[];
}

export function lockKey(lock: LockReference): string {
  return `${lock.chainId}:${lock.status === "mock" ? lock.id : lock.address.toLowerCase()}`;
}

export function createMockWeb3({ delayMs = 700, now = Date.now, seedLocks = [] }: MockOptions = {}) {
  const durations = new Map(seedLocks.map(({ lock, durationDays }) => [lockKey(lock), durationDays]));
  const memberships = new Map<string, number>();
  const delayed = new Set<string>();
  const proofs = new Map<string, RegisteredProof>();
  const operations = new Map<string, Promise<unknown>>();
  let scenario: DemoScenario = "success";
  let counter = 0;
  const pause = () => new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  const memberKey = ({ account, lock }: MembershipInput) => `${lockKey(lock)}:${account.toLowerCase()}`;

  function validate(account: WalletAddress, chainId: number, expectedChain: number) {
    if (!/^0x[\da-f]{40}$/i.test(account)) throw new AppError("invalid-input", "Connect a valid wallet or select a demo account.");
    if (chainId !== expectedChain) throw new AppError("wrong-network", "Switch to the required network before confirming.");
  }

  function consume(value: DemoScenario): boolean {
    if (scenario !== value) return false;
    scenario = "success";
    return true;
  }

  function transaction(chainId: number): TransactionReference {
    return { mode: "mock", id: `simulation-${++counter}`, chainId };
  }

  async function once<T>(operation: string, input: OperationContext, action: () => Promise<T>): Promise<T> {
    const key = `${operation}:${input.chainId}:${input.account.toLowerCase()}:${input.requestId}`;
    const existing = operations.get(key);
    if (existing) return existing as Promise<T>; // This map is indexed by a stable typed operation name.
    const pending = action();
    operations.set(key, pending);
    try { return await pending; }
    catch (error) { operations.delete(key); throw error; }
  }

  const adapter: Web3Adapter = {
    async createMembershipLock(input: CreateLockInput) {
      validate(input.account, input.chainId, 133);
      if (input.priceBaseUnits <= 0n || !Number.isInteger(input.durationDays) || input.durationDays < 1) {
        throw new AppError("invalid-input", "Set a positive membership price and duration.");
      }
      return once("create", input, async () => {
        await pause();
        if (consume("reject")) throw new AppError("rejected", "You rejected the simulated transaction. Your draft is safe.");
        const lock: LockReference = { status: "mock", id: `demo-lock-${++counter}`, chainId: 133 };
        durations.set(lockKey(lock), input.durationDays);
        return { lock, transaction: transaction(133) };
      });
    },
    async purchaseMembership(input) {
      validate(input.account, input.chainId, 133);
      if (input.lock.chainId !== 133 || !durations.has(lockKey(input.lock))) throw new AppError("invalid-input", "This membership is unavailable.");
      return once(`purchase:${lockKey(input.lock)}`, input, async () => {
        await pause();
        if (consume("reject")) throw new AppError("rejected", "You rejected the simulated purchase. No membership was purchased.");
        if (consume("purchase-error")) throw new AppError("transaction", "The simulated purchase failed. You can safely retry.");
        const key = memberKey(input);
        memberships.set(key, now() + durations.get(lockKey(input.lock))! * 86_400_000);
        if (consume("membership-delay")) delayed.add(key);
        return transaction(133);
      });
    },
    async hasMembership(input) {
      await pause();
      if (consume("read-error")) throw new AppError("rpc", "Membership verification is unavailable. Retry verification; do not purchase again.");
      const key = memberKey(input);
      if (delayed.delete(key)) return false;
      return (memberships.get(key) ?? 0) > now();
    },
    async registerContentProof(input: RegisterProofInput) {
      validate(input.account, input.chainId, 43113);
      if (!/^0x[\da-f]{64}$/i.test(input.metadataHash)) throw new AppError("invalid-input", "The public metadata digest is invalid.");
      return once("proof", input, async () => {
        await pause();
        if (consume("reject")) throw new AppError("rejected", "You rejected proof registration. The membership lock is preserved.");
        if (consume("proof-error")) throw new AppError("transaction", "Proof registration failed. Retry this step; your lock is preserved.");
        const proof: RegisteredProof = { status: "mock", id: `demo-proof-${++counter}`, chainId: 43113 };
        proofs.set(input.publicationId, proof);
        return { proof, transaction: transaction(43113) };
      });
    },
    async getContentProof(publicationId) {
      await pause();
      if (consume("read-error")) throw new AppError("rpc", "The proof lookup failed. Retry without registering another proof.");
      return proofs.get(publicationId);
    },
  };

  return { ...adapter, setScenario(next: DemoScenario) { scenario = next; } };
}
