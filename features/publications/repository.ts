import { mockCreators } from "@/lib/mocks/creators";
import { mockPublications } from "@/lib/mocks/publications";
import type { Creator } from "@/types/creator";
import type { Publication } from "@/types/publication";
import type { PublicationRecord } from "@/lib/supabase/types";

export interface PublicationSummary {
  readonly publication: Publication;
  readonly creator: Creator;
}

export function getCreatorByAddress(address: string): Creator | undefined {
  return mockCreators.find((creator) => creator.address.toLowerCase() === address.toLowerCase());
}

export function getPublicationById(id: string): PublicationSummary | undefined {
  const publication = mockPublications.find((item) => item.id === id);
  if (!publication) return undefined;

  const creator = getCreatorByAddress(publication.creatorAddress);
  if (!creator) throw new Error(`Creator missing for publication ${publication.id}`);
  return { publication, creator };
}

export function listPublications(creatorAddress?: string): readonly PublicationSummary[] {
  return mockPublications
    .filter((item) => !creatorAddress || item.creatorAddress.toLowerCase() === creatorAddress.toLowerCase())
    .map((publication) => {
      const creator = getCreatorByAddress(publication.creatorAddress);
      if (!creator) throw new Error(`Creator missing for publication ${publication.id}`);
      return { publication, creator };
    });
}

export function publicationRecordToSummary(pub: PublicationRecord): PublicationSummary {
  const shortAddress = pub.creatorWallet.slice(0, 6) + "..." + pub.creatorWallet.slice(-4);
  const initials = pub.creatorWallet.length >= 4 ? pub.creatorWallet.slice(2, 4).toUpperCase() : "DV";
  const readingMinutes = Math.max(1, Math.ceil(((pub.preview?.length || 0) + (pub.premiumContent?.length || 0)) / 800));

  const existingCreator = getCreatorByAddress(pub.creatorWallet);
  const creator: Creator = existingCreator || {
    address: pub.creatorWallet.toLowerCase() as `0x${string}`,
    name: shortAddress,
    bio: "Independent Web3 Creator on DevVault",
    initials,
  };

  const isConfirmedLock = Boolean(pub.lockAddress && pub.lockAddress.startsWith("0x") && pub.lockAddress.length === 42);
  const isConfirmedProof = Boolean(pub.avalancheTx && pub.avalancheTx.startsWith("0x"));

  const publication: Publication = {
    id: pub.id,
    title: pub.title,
    preview: pub.description || pub.preview,
    creatorAddress: pub.creatorWallet.toLowerCase() as `0x${string}`,
    publishedAt: pub.createdAt || new Date().toISOString(),
    category: pub.isGated ? "Exclusive Research" : "General Architecture",
    readingMinutes,
    membership: {
      price: "10",
      currency: "HSK",
      durationDays: 30,
      network: "hashkey",
      lock: isConfirmedLock
        ? { status: "confirmed", address: pub.lockAddress!.toLowerCase() as `0x${string}`, chainId: 133 }
        : { status: "mock", id: pub.lockAddress || "mock-lock-hsk", chainId: 133 },
    },
    proof: isConfirmedProof
      ? {
          status: "confirmed",
          chainId: 43113,
          transactionHash: pub.avalancheTx as `0x${string}`,
          contentHash: (pub.contentHash || "0x") as `0x${string}`,
        }
      : {
          status: "mock",
          id: pub.proofId || pub.id,
          chainId: 43113,
        },
    projectType: pub.projectType || "article",
    repositoryUrl: pub.repositoryUrl,
    zipUrl: pub.zipUrl,
    demoUrl: pub.demoUrl,
    demoPreviewCode: pub.demoPreviewCode,
    isHidden: pub.isHidden,
  };

  return { publication, creator };
}

export async function resolvePublication(id: string): Promise<PublicationSummary | undefined> {
  try {
    const { serverDb } = await import("@/lib/supabase/server");
    const dbRecord = await serverDb.publications.getById(id);
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
      return dbRecords.map(publicationRecordToSummary);
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
