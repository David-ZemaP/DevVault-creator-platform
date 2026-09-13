import type { Publication } from "@/types/publication";
import { mockCreators } from "./creators";

export const mockPublications = [
  {
    id: "membership-experiences",
    title: "Designing a membership worth belonging to",
    preview:
      "A good subscription starts with a clear promise. Explore how to turn your expertise into a membership people understand, from the first preview to the moment their content unlocks.",
    creatorAddress: mockCreators[0].address,
    publishedAt: "2026-09-08T12:00:00.000Z",
    category: "Product & design",
    readingMinutes: 8,
    membership: {
      price: "5",
      currency: "DEMO",
      durationDays: 30,
      network: "hashkey",
      lock: { status: "pending" },
    },
    proof: { status: "pending" },
  },
  {
    id: "creator-toolkit",
    title: "The independent creator’s Web3 toolkit",
    preview:
      "You bring the ideas. Your tools should help you share them. A practical look at publishing workflows, member access, and keeping the experience simple for your readers.",
    creatorAddress: mockCreators[1].address,
    publishedAt: "2026-09-07T12:00:00.000Z",
    category: "Creator guides",
    readingMinutes: 6,
    membership: {
      price: "3",
      currency: "DEMO",
      durationDays: 30,
      network: "hashkey",
      lock: { status: "pending" },
    },
    proof: { status: "pending" },
  },
  {
    id: "behind-the-proof",
    title: "Behind the proof: a record of your creative work",
    preview:
      "What can a content proof tell a reader? Follow the journey from a published piece to its on-chain record, and learn why provenance and access are two different parts of the experience.",
    creatorAddress: mockCreators[2].address,
    publishedAt: "2026-09-06T12:00:00.000Z",
    category: "Digital ownership",
    readingMinutes: 10,
    membership: {
      price: "4",
      currency: "DEMO",
      durationDays: 30,
      network: "hashkey",
      lock: { status: "pending" },
    },
    proof: { status: "pending" },
  },
] as const satisfies readonly Publication[];
