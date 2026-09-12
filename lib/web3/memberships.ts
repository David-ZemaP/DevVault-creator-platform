export interface MembershipTier {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  durationDays: number;
  lockAddress?: `0x${string}`;
  perks: string[];
}

export const DEFAULT_MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "supporter",
    name: "Community Supporter",
    description: "Support the creator and unlock exclusive community posts.",
    price: "0.5",
    currency: "AVAX",
    durationDays: 30,
    perks: ["Access to subscriber-only posts", "Early access to public drops", "Badge on profile"],
  },
  {
    id: "vip",
    name: "VIP Inner Circle",
    description: "Full access to premium content, source files, and 1-on-1 Q&A sessions.",
    price: "2.0",
    currency: "AVAX",
    durationDays: 30,
    perks: [
      "All Supporter perks",
      "Full access to raw source files & repos",
      "Private Discord / Telegram channel access",
      "Monthly group AMA call",
    ],
  },
];
