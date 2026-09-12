import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck, ExternalLink } from "lucide-react";
import { resolvePublication } from "@/features/publications/server-repository";
import { LockedContent } from "@/components/membership/locked-content";
import { UnlockedContent } from "@/components/content/unlocked-content";
import { AccessPreviewControls } from "@/components/membership/access-preview-controls";
import { getDevelopmentAccessPreview } from "@/features/publications/development-access-preview";
import { cn, formatDate, formatAddress } from "@/lib/utils";
import { getExplorerTxUrl } from "@/lib/web3/avalanche";
import { getHskExplorerAddressUrl } from "@/lib/web3/hashkey";
import { SoftwareDemoRunner } from "@/components/content/software-demo-runner";
import { SourcePurchase } from "@/components/content/source-purchase";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await resolvePublication(id);
  return {
    title: result?.publication.title ?? "Publication not found",
    description: result?.publication.preview,
  };
}

export default async function ContentDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const result = await resolvePublication(id);
  if (!result) notFound();
  const { publication, creator } = result;
  const previewQuery = process.env.NODE_ENV === "development" ? await searchParams : undefined;
  const premiumPreview = await getDevelopmentAccessPreview(id, previewQuery?.previewAccess);

  const hasConfirmedProof = publication.proof.status === "confirmed";
  const hasConfirmedLock = publication.membership.lock.status === "confirmed";

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex min-h-9 items-center gap-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Back to Explore
      </Link>

      {process.env.NODE_ENV === "development" && (
        <AccessPreviewControls publicationId={id} isUnlocked={Boolean(premiumPreview)} />
      )}

      <div
        className={cn(
          "grid items-start gap-8 lg:gap-12",
          premiumPreview ? "mx-auto max-w-3xl" : "lg:grid-cols-[minmax(0,1fr)_340px]",
        )}
      >
        <article className="min-w-0">
          <header className="border-b border-zinc-800/80 pb-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                {publication.category}
              </span>
              {hasConfirmedProof && (
                <span className="inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>Fuji Proof Verified</span>
                </span>
              )}
            </div>

            <h1 className="mt-3.5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              {publication.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <Link
                href={`/profile/${creator.address}`}
                className="flex items-center gap-2 rounded text-zinc-200 hover:text-white transition-colors"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-[10px] font-bold"
                >
                  {creator.initials}
                </span>
                <span className="font-medium">{creator.name}</span>
              </Link>
              <span className="text-zinc-600">·</span>
              <time dateTime={publication.publishedAt}>
                {formatDate(new Date(publication.publishedAt))}
              </time>
              <span className="text-zinc-600">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-zinc-500" />
                {publication.readingMinutes} min read
              </span>
            </div>

            {(hasConfirmedProof || hasConfirmedLock) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
                {hasConfirmedProof && publication.proof.status === "confirmed" && (
                  <>
                    <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-mono text-zinc-300">
                      Proof: {publication.proof.contentHash.slice(0, 10)}...{publication.proof.contentHash.slice(-6)}
                    </span>
                    <a
                      href={getExplorerTxUrl(publication.proof.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-white transition-colors"
                    >
                      <span>Snowtrace Tx</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}

                {hasConfirmedLock && publication.membership.lock.status === "confirmed" && (
                  <a
                    href={getHskExplorerAddressUrl(publication.membership.lock.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
                  >
                    <span>HSK Lock: {formatAddress(publication.membership.lock.address)}</span>
                    <ExternalLink className="h-3 w-3 text-zinc-400" />
                  </a>
                )}
              </div>
            )}
          </header>

          <section aria-labelledby="preview-heading" className="py-6">
            <h2 id="preview-heading" className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Public preview
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-300">{publication.preview}</p>
          </section>

          {publication.description && publication.description !== publication.preview && (
            <section className="py-5 border-t border-zinc-800/80">
              <h2 className="text-sm font-semibold text-white">About this project</h2>
              <p className="mt-2.5 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-zinc-400">
                {publication.description}
              </p>
            </section>
          )}

          {/* Interactive Software Execution Sandbox & Functional Demo */}
          <div className="my-6">
            <SoftwareDemoRunner
              title={publication.title}
              demoUrl={publication.demoUrl}
              demoVideoUrl={publication.demoVideoUrl}
              projectType={publication.projectType}
            />
          </div>

          {premiumPreview && <UnlockedContent content={premiumPreview} />}

          <p className="border-t border-zinc-800/80 pt-4 text-xs text-zinc-500">
            {hasConfirmedProof
              ? "Avalanche Fuji Proof Anchored · Immutable Content Commitment"
              : "Demo publication · Content proof pending"}
          </p>
        </article>

        <div className="space-y-6">
          {publication.projectType === "software" && (
            <SourcePurchase id={id} priceWei={publication.priceWei} acquisitionModel={publication.acquisitionModel} />
          )}

          {publication.projectType !== "software" && !premiumPreview && (
            <LockedContent creatorName={creator.name} membership={publication.membership} />
          )}
        </div>
      </div>
    </div>
  );
}
