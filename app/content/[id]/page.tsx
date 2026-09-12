"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatAddress, formatDate } from "@/lib/utils";
import { getExplorerTxUrl } from "@/lib/web3/avalanche";
import { getHskExplorerAddressUrl } from "@/lib/web3/hashkey";
import { apiClient, PublicationRecord } from "@/lib/api/client";
import { MembershipGate } from "@/components/membership/membership-gate";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, ExternalLink, Copy, Check, FileQuestion } from "lucide-react";

export default function ContentDetailPage() {
  const routeParams = useParams();
  const id = Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id as string);

  const [publication, setPublication] = useState<PublicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPublication() {
      if (!id) return;
      setIsLoading(true);
      setNotFound(false);

      try {
        const res = await apiClient.getPublication(id);
        if (isMounted) {
          if (res.data?.publication) {
            setPublication(res.data.publication);
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.error("Failed to load publication:", err);
        if (isMounted) {
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPublication();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCopyProof = () => {
    if (publication?.contentHash) {
      navigator.clipboard.writeText(publication.contentHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        <div className="h-4 w-28 bg-neutral-800 rounded" />
        <div className="space-y-4 border-b border-neutral-800 pb-6">
          <div className="h-4 w-40 bg-neutral-800 rounded" />
          <div className="h-10 w-3/4 bg-neutral-800 rounded" />
          <div className="flex gap-3 pt-2">
            <div className="h-6 w-36 bg-neutral-800 rounded" />
            <div className="h-6 w-24 bg-neutral-800 rounded" />
          </div>
        </div>
        <div className="h-32 bg-neutral-800/40 rounded-xl" />
      </div>
    );
  }

  if (notFound || !publication) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center mt-12 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-800 border border-neutral-700 text-neutral-400">
          <FileQuestion className="h-7 w-7 text-neutral-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Publication Not Found</h1>
        <p className="text-sm text-neutral-400">
          The publication you are looking for does not exist or could not be loaded from the registry.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const createdAtSeconds = publication.createdAt
    ? Math.floor(new Date(publication.createdAt).getTime() / 1000)
    : Math.floor(Date.now() / 1000);

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
              href={`/profile/${publication.creatorWallet}`}
              className="font-mono text-red-400 hover:underline"
            >
              {formatAddress(publication.creatorWallet)}
            </Link>
            <span>•</span>
            <time>{formatDate(createdAtSeconds)}</time>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {publication.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-300 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Proof: {publication.contentHash.slice(0, 10)}...{publication.contentHash.slice(-8)}</span>
              <button
                type="button"
                onClick={handleCopyProof}
                title="Copy full content proof hash"
                className="ml-1 text-neutral-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </span>

            {publication.lockAddress && (
              <a
                href={getHskExplorerAddressUrl(publication.lockAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <span>HSK Lock: {formatAddress(publication.lockAddress)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {publication.avalancheTx && (
              <a
                href={getExplorerTxUrl(publication.avalancheTx)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-400 hover:text-red-400 transition-colors"
              >
                <span>Tx: {formatAddress(publication.avalancheTx)}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </header>

        {publication.preview && (
          <div className="text-base text-neutral-300 leading-relaxed font-sans">
            <p>{publication.preview}</p>
          </div>
        )}

        <MembershipGate isGated={Boolean(publication.lockAddress)} lockAddress={publication.lockAddress}>
          <div className="prose prose-invert max-w-none space-y-4 text-neutral-200 leading-relaxed">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 whitespace-pre-wrap font-sans">
              {publication.premiumContent || publication.preview}
            </div>
          </div>
        </MembershipGate>
      </article>
    </div>
  );
}
