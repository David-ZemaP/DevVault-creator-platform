import { mockCreators } from "@/lib/mocks/creators";
import { mockPublications } from "@/lib/mocks/publications";
import type { Creator } from "@/types/creator";
import type { Publication } from "@/types/publication";

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
