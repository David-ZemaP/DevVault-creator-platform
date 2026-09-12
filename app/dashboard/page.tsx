"use client";

import { PurchaseLibrary } from "@/components/content/purchase-library";
import { CreatorDrafts } from "@/components/content/creator-drafts";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { PublicationList } from "@/components/content/publication-list";
import { apiClient } from "@/lib/api/client";
import { publicationRecordToSummary, type PublicationSummary } from "@/features/publications/repository";
import Link from "next/link";
import { PlusCircle, TrendingUp, Users, FileCheck2, ShieldAlert } from "lucide-react";

export default function CreatorDashboardPage() {
  const { address, isConnected } = useAccount();

  const [publications, setPublications] = useState<PublicationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadMyPublications() {
      if (!address || !isConnected) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiClient.getPublications(address);
        if (isMounted && res.data?.publications) {
          const summaries = res.data.publications.map(publicationRecordToSummary);
          setPublications(summaries);
        }
      } catch (err) {
        console.error("Failed to fetch creator publications:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMyPublications();

    return () => {
      isMounted = false;
    };
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 text-center mt-12 shadow-sm">
        <ShieldAlert className="h-8 w-8 text-amber-400 mx-auto mb-2.5" />
        <h2 className="text-lg font-bold text-white">Connect Wallet Required</h2>
        <p className="mt-1.5 text-xs text-zinc-400">
          Please connect your Web3 wallet to access your creator dashboard and publications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CreatorDrafts />
      <PurchaseLibrary sales />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Creator Dashboard</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Manage your on-chain publications, memberships, and analytics.
          </p>
        </div>

        <Link href="/create">
          <Button variant="primary" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Publication
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <FileCheck2 className="h-3.5 w-3.5 text-blue-400" />
            Published Items
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {isLoading ? "..." : publications.length}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            Active Key Holders
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {isLoading ? "..." : "—"}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            Revenue Earned
          </div>
          <div className="mt-2 text-base font-semibold text-white">
            {isLoading ? "..." : "See confirmed sales above"}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Your Publications</h2>
          <span className="text-xs text-zinc-500">{publications.length} total</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 animate-pulse space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="h-3.5 w-24 bg-zinc-800 rounded" />
                  <div className="h-3.5 w-14 bg-zinc-800 rounded-full" />
                </div>
                <div className="h-5 w-3/4 bg-zinc-800 rounded" />
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-zinc-800 rounded" />
                  <div className="h-3 w-5/6 bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PublicationList publications={publications} />
        )}
      </div>
    </div>
  );
}
