import type { WalletAddress } from "./creator";

export interface MembershipOffer {
  /** Decimal display value. Convert to base units only in the Web3 adapter. */
  readonly price: string;
  readonly currency: string;
  readonly durationDays: number;
  readonly network: "hashkey";
  readonly lock:
    | { readonly status: "pending" }
    | { readonly status: "mock"; readonly id: string; readonly chainId: number }
    | { readonly status: "confirmed"; readonly address: WalletAddress; readonly chainId: number };
}

export type ProofReference =
  | { readonly status: "pending" }
  | { readonly status: "mock"; readonly id: string; readonly chainId: number }
  | {
      readonly status: "confirmed";
      readonly chainId: number;
      readonly transactionHash: `0x${string}`;
      readonly contentHash: `0x${string}`;
    };

/** Public metadata only. Never add the premium body to this object. */
export interface Publication {
  readonly id: string;
  readonly title: string;
  readonly preview: string;
  readonly description?: string;
  readonly creatorAddress: WalletAddress;
  readonly publishedAt: string;
  readonly category: string;
  readonly readingMinutes: number;
  readonly membership: MembershipOffer;
  readonly proof: ProofReference;
  readonly projectType?: "article" | "software";
  readonly priceWei?: string;
  readonly demoVideoUrl?: string;
  readonly coverImage?: string;
  readonly demoUrl?: string;
  readonly demoPreviewCode?: string;
  readonly isHidden?: boolean;
}

/** Delivered separately after authorization once the backend is integrated. */
export interface PremiumContent {
  readonly publicationId: string;
  readonly body: string;
  readonly format: "text";
}
