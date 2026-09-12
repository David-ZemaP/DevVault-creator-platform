import React from "react";
import { formatAddress } from "@/lib/utils";
import { ContentCard } from "@/components/content/content-card";
import { getExplorerAddressUrl } from "@/lib/web3/avalanche";
import { ExternalLink, ShieldCheck, User } from "lucide-react";

interface PageProps {
  params: { address: string };
}

export default function ProfilePage({ params }: PageProps) {
  const { address } = params;

  const mockCreatorContent = [
    {
      id: "0x001",
      title: "Building High-Throughput Subnets on Avalanche",
      description: "A deep architectural dive into customizing EVM execution runtimes.",
      author: address,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 2,
      isGated: false,
    },
    {
      id: "0x002",
      title: "Token-Gated Creator Monetization with Unlock Protocol",
      description: "Full guide and contract templates to tokenize your newsletter or video vault.",
      author: address,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 5,
      isGated: true,
      lockAddress: "0x1234567890123456789012345678901234567890",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-800 border border-neutral-700 text-neutral-300">
            <User className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
                {formatAddress(address)}
              </h1>
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>

            <a
              href={getExplorerAddressUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-400 transition-colors"
            >
              <span>View on Snowtrace</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Creator Publications */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Publications by this Creator</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockCreatorContent.map((pub) => (
            <ContentCard key={pub.id} {...pub} />
          ))}
        </div>
      </div>
    </div>
  );
}
