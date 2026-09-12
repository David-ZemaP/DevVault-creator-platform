import "server-only";
import { isPublic } from "@/lib/marketplace/public";
import { getPublicationById, getCreatorByAddress, listPublications, publicationRecordToSummary, type PublicationSummary } from "./repository";
import type { Creator } from "@/types/creator";
export async function resolvePublication(id: string): Promise<PublicationSummary | undefined> {
  try {
    const { serverDb } = await import("@/lib/supabase/server");
    const dbRecord = await serverDb.publications.getById(id);
    if (dbRecord && !isPublic(dbRecord)) return undefined;
    if (dbRecord) {
      return publicationRecordToSummary(dbRecord);
    }
  } catch (err) {
    console.warn("Could not resolve publication from server storage:", err);
  }

  return getPublicationById(id);
}

export async function resolveAllPublications(creatorAddress?: string): Promise<readonly PublicationSummary[]> {
  try {
    const { serverDb } = await import("@/lib/supabase/server");
    const dbRecords = await serverDb.publications.list(creatorAddress);
    if (dbRecords && dbRecords.length > 0) {
      return dbRecords.filter(isPublic).map(publicationRecordToSummary);
    }
  } catch (err) {
    console.warn("Could not load publications from server storage:", err);
  }

  return listPublications(creatorAddress);
}

export async function resolveCreator(address: string): Promise<Creator | undefined> {
  const mockCreator = getCreatorByAddress(address);
  if (mockCreator) return mockCreator;

  try {
    const { serverDb } = await import("@/lib/supabase/server");
    const dbUser = await serverDb.users.getByWallet(address);
    if (dbUser) {
      const shortAddress = dbUser.wallet.slice(0, 6) + "..." + dbUser.wallet.slice(-4);
      const initials = dbUser.wallet.length >= 4 ? dbUser.wallet.slice(2, 4).toUpperCase() : "DV";
      return {
        address: dbUser.wallet.toLowerCase() as `0x${string}`,
        name: dbUser.username || shortAddress,
        bio: "Independent Web3 Creator on DevVault",
        initials,
      };
    }
  } catch (err) {
    console.warn("Could not load creator from server storage:", err);
  }
  return undefined;
}
