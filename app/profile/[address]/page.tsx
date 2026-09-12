"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatAddress } from "@/lib/utils";
import { ContentCard } from "@/components/content/content-card";
import { getExplorerAddressUrl } from "@/lib/web3/avalanche";
import { apiClient, PublicationRecord } from "@/lib/api/client";
import { ExternalLink, ShieldCheck, User, FileText } from "lucide-react";

export default function ProfilePage() {
  const routeParams = useParams();
  const address = Array.isArray(routeParams?.address)
    ? routeParams.address[0]
    : (routeParams?.address as string);

  const [publications, setPublications] = useState<PublicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCreatorPublications() {
      if (!address) return;
      setIsLoading(true);

      try {
        const res = await apiClient.getPublications(address);
        if (isMounted && res.data?.publications) {
          setPublications(res.data.publications);
        }
      } catch (err) {
        console.error("Failed to fetch creator publications:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCreatorPublications();

    return () => {
      isMounted = false;
    };
  }, [address]);

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

            {address && (
              <a
                href={getExplorerAddressUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-400 transition-colors"
              >
                <span>View on Snowtrace</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Creator Publications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Publications by this Creator</h2>
          {!isLoading && (
            <span className="text-xs text-neutral-400">
              {publications.length} {publications.length === 1 ? "publication" : "publications"}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-28 bg-neutral-800 rounded" />
                  <div className="h-4 w-16 bg-neutral-800 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-neutral-800 rounded" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-neutral-800 rounded" />
                  <div className="h-3.5 w-5/6 bg-neutral-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : publications.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 border border-neutral-700 text-neutral-400 mb-3">
              <FileText className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-bold text-white">No Publications Found</h3>
            <p className="mt-1 text-sm text-neutral-400 max-w-sm mx-auto">
              This creator has not published any verified content yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publications.map((pub) => {
              const createdAtTimestamp = pub.createdAt
                ? Math.floor(new Date(pub.createdAt).getTime() / 1000)
                : Math.floor(Date.now() / 1000);

              return (
                <ContentCard
                  key={pub.id}
                  id={pub.id}
                  title={pub.title}
                  description={pub.description || pub.preview}
                  author={pub.creatorWallet}
                  createdAt={createdAtTimestamp}
                  isGated={Boolean(pub.lockAddress)}
                  lockAddress={pub.lockAddress}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
