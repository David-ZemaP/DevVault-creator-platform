"use client";

import React from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content/content-card";
import Link from "next/link";
import { PlusCircle, TrendingUp, Users, FileCheck2, ShieldAlert } from "lucide-react";

export default function CreatorDashboardPage() {
  const { address, isConnected } = useAccount();

  const mockMyContent = [
    {
      id: "0x001",
      title: "Building High-Throughput Subnets on Avalanche",
      description: "A deep architectural dive into customizing EVM execution runtimes.",
      author: address || "0x0000000000000000000000000000000000000000",
      createdAt: Math.floor(Date.now() / 1000) - 12000,
      isGated: false,
    },
  ];

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center mt-12">
        <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Connect Wallet Required</h2>
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

        <Link href="/create">
          <Button variant="primary" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Publication
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
            <FileCheck2 className="h-4 w-4 text-red-500" />
            Verified Publications
          </div>
          <div className="mt-2 text-2xl font-bold text-white">3</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
            <Users className="h-4 w-4 text-red-500" />
            Active Key Holders
          </div>
          <div className="mt-2 text-2xl font-bold text-white">42</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
            <TrendingUp className="h-4 w-4 text-red-500" />
            Revenue Earned
          </div>
          <div className="mt-2 text-2xl font-bold text-white">21.5 AVAX</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Your Publications</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {mockMyContent.map((pub) => (
            <ContentCard key={pub.id} {...pub} />
          ))}
        </div>
      </div>
    </div>
  );
}
