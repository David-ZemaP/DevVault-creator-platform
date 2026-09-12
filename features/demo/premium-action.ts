"use server";

import type { PremiumContent } from "@/types/publication";
/** Fictional fixture delivery only. This is NOT a production authorization endpoint. */
export async function loadFictionalContent(id: string): Promise<{ content?: PremiumContent; error?: "access-denied" | "backend" }> {
  if (process.env.NODE_ENV !== "development") return { error: "access-denied" };
  if (typeof id !== "string" || id.length > 120) return { error: "backend" };
  const { mockPremiumContent } = await import("@/lib/mocks/premium-content");
  const content = mockPremiumContent.find((item) => item.publicationId === id);
  return content ? { content } : { error: "backend" };
}
