import type { PremiumContent } from "@/types/publication";

/** Fictional fixtures only. Selected server-side for the explicit development preview. */
export const mockPremiumContent = [
  {
    publicationId: "membership-experiences",
    body: "Premium demo: Start with one membership promise. Describe the publishing cadence, show a useful preview, and make the access confirmation unmistakable.",
    format: "text",
  },
  {
    publicationId: "creator-toolkit",
    body: "Premium demo: Keep publication drafts, public metadata, membership operations, and protected delivery separate. Each boundary should be testable on its own.",
    format: "text",
  },
  {
    publicationId: "behind-the-proof",
    body: "Premium demo: A proof records a reference to content. It does not replace server authorization, establish legal ownership, or guarantee that a reader has access.",
    format: "text",
  },
] as const satisfies readonly PremiumContent[];
