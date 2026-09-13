import "server-only";
import { isPublic } from "@/lib/marketplace/public";
import { publicationRecordToSummary, type PublicationSummary } from "./repository";
import type { Creator } from "@/types/creator";

export async function resolvePublication(id: string): Promise<PublicationSummary | undefined> {
  const { serverDb } = await import("@/lib/supabase/server");
  const dbRecord = await serverDb.publications.getById(id);
  if (!dbRecord || !isPublic(dbRecord)) return undefined;
  return publicationRecordToSummary(dbRecord);
}

export async function resolveAllPublications(creatorAddress?: string): Promise<readonly PublicationSummary[]> {
  const { serverDb } = await import("@/lib/supabase/server");
  const dbRecords = await serverDb.publications.list(creatorAddress);
  return dbRecords.filter(isPublic).map(publicationRecordToSummary);
}

export async function resolveCreator(address: string): Promise<Creator | undefined> {
  const { serverDb } = await import("@/lib/supabase/server");
  const dbUser = await serverDb.users.getByWallet(address);
  if (!dbUser) return undefined;
  const shortAddress = dbUser.wallet.slice(0, 6) + "..." + dbUser.wallet.slice(-4);
  const initials = dbUser.wallet.length >= 4 ? dbUser.wallet.slice(2, 4).toUpperCase() : "DV";
  return {
    address: dbUser.wallet.toLowerCase() as `0x${string}`,
    name: dbUser.username || shortAddress,
    bio: "Independent Web3 Creator on DevVault",
    initials,
  };
}
