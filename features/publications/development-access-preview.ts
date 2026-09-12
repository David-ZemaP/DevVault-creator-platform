import "server-only";
import type { PremiumContent } from "@/types/publication";

/** Visual fixture selection only. Never use this as membership authorization. */
export async function getDevelopmentAccessPreview(
  publicationId: string,
  requestedAccess: string | string[] | undefined,
): Promise<PremiumContent | undefined> {
  if (process.env.NODE_ENV !== "development" || requestedAccess !== "unlocked") {
    return undefined;
  }

  const { mockPremiumContent } = await import("@/lib/mocks/premium-content");
  return mockPremiumContent.find((content) => content.publicationId === publicationId);
}
