import { createMockWeb3 } from "./adapters/mock";
import { mockPublications } from "../mocks/publications";

export function fixtureLock(id: string) { return { status: "mock" as const, id: `fixture-${id}`, chainId: 133 }; }
/** Single in-memory adapter for this tab; replace through the application service boundary. */
export const demoWeb3 = createMockWeb3({ seedLocks: mockPublications.map((item) => ({ lock: fixtureLock(item.id), durationDays: item.membership.durationDays })) });
