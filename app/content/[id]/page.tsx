import React from "react";
import Link from "next/link";
import { formatAddress, formatDate } from "@/lib/utils";
import { MembershipGate } from "@/components/membership/membership-gate";
import { ShieldCheck, ArrowLeft, ExternalLink } from "lucide-react";

interface PageProps {
  params: { id: string };
}

export default function ContentDetailPage({ params }: PageProps) {
  const { id } = params;

  // Mock content proof record
  const contentItem = {
    id,
    title: "Token-Gated Creator Monetization with Unlock Protocol",
    description: "Full guide and contract templates to tokenize your newsletter or video vault with self-sovereign NFT keys.",
    body: `
# Decentralized Subscriptions on Avalanche

Unlock Protocol allows creators to deploy their own Non-Fungible Token lock contracts directly onto Avalanche C-Chain. When users mint a key, they receive a time-limited ERC-721 token that acts as their access pass.

## Why Token Gating Over Centralized Web2 Subscriptions?

1. **No Intermediary Fees**: Payment flows peer-to-peer directly from subscriber to creator wallet.
2. **True Ownership**: Subscribers can transfer, renew, or resell their access passes.
3. **Composability**: Your Unlock keys can grant access across multiple frontends, Discord servers, and Telegram groups.
    `,
    author: "0x9812A4F9901fB9189280a82B8bfa4E06A2665972",
    createdAt: Math.floor(Date.now() / 1000) - 86400,
    isGated: true,
    lockAddress: "0x1234567890123456789012345678901234567890",
    contentHash: "0x892348a87b1405c93c47318029d9124458f001efda091bc8d331908990a421b0",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Explore
      </Link>

      <article className="space-y-6">
        <header className="space-y-4 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <Link
              href={`/profile/${contentItem.author}`}
              className="font-mono text-red-400 hover:underline"
            >
              {formatAddress(contentItem.author)}
            </Link>
            <span>•</span>
            <time>{formatDate(contentItem.createdAt)}</time>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {contentItem.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Proof: {contentItem.contentHash.slice(0, 10)}...{contentItem.contentHash.slice(-8)}
            </span>

            {contentItem.isGated && (
              <span className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
                Lock: {formatAddress(contentItem.lockAddress)}
              </span>
            )}
          </div>
        </header>

        <MembershipGate isGated={contentItem.isGated} lockAddress={contentItem.lockAddress}>
          <div className="prose prose-invert max-w-none space-y-4 text-neutral-300 leading-relaxed">
            <p>{contentItem.description}</p>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 whitespace-pre-wrap font-sans">
              {contentItem.body}
            </div>
          </div>
        </MembershipGate>
      </article>
    </div>
  );
}
