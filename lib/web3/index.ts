export type { Web3Adapter, TransactionReference, LockReference, RegisteredProof } from "./types";
export { createMockWeb3 } from "./adapters/mock";
export type { WalletPort, WalletSnapshot, PremiumContentPort } from "./integration";
// The real SDK adapter belongs here once Persona 2 supplies its implementation.
