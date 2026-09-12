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
  const found = mockPremiumContent.find((content) => content.publicationId === publicationId);
  if (found) return found;

  try {
    const { serverDb } = await import("@/lib/supabase/server");
    const dbRecord = await serverDb.publications.getById(publicationId);
    if (dbRecord?.premiumContent) {
      return {
        publicationId,
        body: `Premium demo:\n\n${dbRecord.premiumContent}`,
        format: "text",
      };
    }
  } catch {}

  return undefined;
}
