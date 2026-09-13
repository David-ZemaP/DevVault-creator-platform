import { publicPublication } from "@/lib/marketplace/public";
import { formatEther } from "viem";
import type { Creator } from "@/types/creator";
import type { Publication } from "@/types/publication";
import type { PublicationRecord } from "@/lib/supabase/types";

export interface PublicationSummary {
  readonly publication: Publication;
  readonly creator: Creator;
  readonly source?: 'database';
}

export function publicationRecordToSummary(pub: PublicationRecord): PublicationSummary {
  pub = publicPublication(pub);
  const shortAddress = pub.creatorWallet.slice(0, 6) + "..." + pub.creatorWallet.slice(-4);
  const initials = pub.creatorWallet.length >= 4 ? pub.creatorWallet.slice(2, 4).toUpperCase() : "DV";
  const readingMinutes = Math.max(1, Math.ceil(((pub.preview?.length || 0) + (pub.description?.length || 0)) / 800));

  const creator: Creator = {
    address: pub.creatorWallet.toLowerCase() as `0x${string}`,
    name: shortAddress,
    bio: "Independent Web3 Creator on DevVault",
    initials,
  };

  const isConfirmedLock = Boolean(pub.lockAddress && /^0x[0-9a-fA-F]{40}$/.test(pub.lockAddress) && !/^0x0{40}$/.test(pub.lockAddress));
  const isConfirmedProof = Boolean(pub.avalancheTx && pub.avalancheTx.startsWith("0x"));

  const publication: Publication = {
    id: pub.id,
    title: pub.title,
    preview: pub.preview,
    description: pub.description,
    creatorAddress: pub.creatorWallet.toLowerCase() as `0x${string}`,
    publishedAt: pub.publishedAt || pub.createdAt || new Date().toISOString(),
    category: pub.projectType === "software" ? "Software" : pub.isGated ? "Exclusive Research" : "General Architecture",
    readingMinutes,
    membership: {
      price: pub.priceWei ? formatEther(BigInt(pub.priceWei)) : "—",
      currency: "HSK",
      durationDays: pub.priceWei ? 30 : 0,
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
    priceWei: pub.priceWei,
    demoVideoUrl: pub.demoVideoUrl,
    coverImage: pub.coverImage,
    projectType: pub.projectType || "article",
    demoUrl: pub.demoUrl,
    demoPreviewCode: pub.demoPreviewCode,
    isHidden: pub.isHidden,
    acquisitionModel: pub.acquisitionModel || "lifetime",
  };

  return { publication, creator, source: 'database' };
}
