"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, PublicationRecord } from "@/lib/api/client";
import { ContentCard } from "@/components/content/content-card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Compass, FileText } from "lucide-react";

export default function ExplorePage() {
  const [publications, setPublications] = useState<PublicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchPublications() {
      try {
        setIsLoading(true);
        const res = await apiClient.getPublications();
        if (isMounted && res.data?.publications) {
          setPublications(res.data.publications);
        }
      } catch (err) {
        console.error("Failed to fetch publications:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPublications();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-red-500 uppercase">
            <Compass className="h-4 w-4" />
            Decentralized Feed
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Explore Publications
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Verifiable on-chain creator proofs and token-gated content powered by Avalanche.
          </p>
        </div>

        <div>
          <Link href="/create">
            <Button variant="primary" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Publish Content
            </Button>
          </Link>
        </div>
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
              <div className="pt-4 border-t border-neutral-800/80 flex justify-between">
                <div className="h-3 w-20 bg-neutral-800 rounded" />
                <div className="h-3 w-16 bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : publications.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800/80 border border-neutral-700 text-neutral-400 mb-4">
            <FileText className="h-7 w-7 text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-white">No Publications Found</h3>
          <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto">
            No on-chain publications have been registered yet. Be the first creator to anchor verifiable content on Avalanche.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/create">
              <Button variant="primary" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create First Publication
              </Button>
            </Link>
          </div>
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
  );
}
