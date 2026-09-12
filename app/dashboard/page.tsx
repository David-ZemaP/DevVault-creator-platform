"use client";

import React from "react";
import { useAccount } from "wagmi";
import { PublicationList } from "@/components/content/publication-list";
import { listPublications } from "@/features/publications/repository";
import Link from "next/link";
import { PlusCircle, TrendingUp, Users, FileCheck2, ShieldAlert } from "lucide-react";

export default function CreatorDashboardPage() {
  const { address, isConnected } = useAccount();

  const publications = address ? listPublications(address) : [];

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center mt-12">
        <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-white">Connect Wallet Required</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Please connect your Web3 wallet to access your creator dashboard and publications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Creator Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Manage your on-chain publications, memberships, and analytics.
          </p>
        </div>

        <Link href="/create" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700">
            <PlusCircle className="h-4 w-4" />
            New Publication
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
            <FileCheck2 className="h-4 w-4 text-red-500" />
            Publications
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{publications.length}</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
            <Users className="h-4 w-4 text-red-500" />
            Active Key Holders
          </div>
          <div className="mt-2 text-2xl font-bold text-white">—</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
            <TrendingUp className="h-4 w-4 text-red-500" />
            Revenue Earned
          </div>
          <div className="mt-2 text-2xl font-bold text-white">—</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Your Publications</h2>
        <PublicationList publications={publications} />
      </div>
    </div>
  );
}
