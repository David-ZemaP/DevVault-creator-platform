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
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to Explore
      </Link>

      {process.env.NODE_ENV === "development" && (
        <AccessPreviewControls publicationId={id} isUnlocked={Boolean(premiumPreview)} />
      )}

      <div
        className={cn(
          "grid items-start gap-10 lg:gap-16",
          premiumPreview ? "mx-auto max-w-3xl" : "lg:grid-cols-[minmax(0,1fr)_340px]",
        )}
      >
        <article className="min-w-0">
          <header className="border-b border-slate-800 pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {publication.category}
              </span>
              {hasConfirmedProof && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Fuji Proof Verified</span>
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {publication.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <Link
                href={`/profile/${creator.address}`}
                className="flex items-center gap-2.5 rounded-lg text-slate-200 hover:text-blue-400 transition-colors"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-bold"
                >
                  {creator.initials}
                </span>
                <span className="font-medium">{creator.name}</span>
              </Link>
              <span className="text-slate-600">·</span>
              <time dateTime={publication.publishedAt}>
                {formatDate(new Date(publication.publishedAt))}
              </time>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 aria-hidden="true" className="h-4 w-4 text-slate-500" />
                {publication.readingMinutes} min read
              </span>
            </div>

            {(hasConfirmedProof || hasConfirmedLock) && (
              <div className="mt-6 flex flex-wrap items-center gap-2.5 pt-2">
                {hasConfirmedProof && publication.proof.status === "confirmed" && (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs font-mono text-slate-300">
                      Proof: {publication.proof.contentHash.slice(0, 10)}...{publication.proof.contentHash.slice(-6)}
                    </span>
                    <a
                      href={getExplorerTxUrl(publication.proof.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-400 hover:border-slate-700 hover:text-blue-400 transition-colors"
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
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
                  >
                    <span>HSK Lock: {formatAddress(publication.membership.lock.address)}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </header>

          <section aria-labelledby="preview-heading" className="py-8">
            <h2 id="preview-heading" className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
              Public preview
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">{publication.preview}</p>
          </section>

          {publication.description && publication.description !== publication.preview && (
            <section className="py-6 border-t border-slate-800/80">
              <h2 className="text-base font-bold text-white">About this project</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{publication.description}</p>
            </section>
          )}

          {/* Interactive Software Execution Sandbox & Functional Demo */}
          <div className="my-8">
            <SoftwareDemoRunner
              title={publication.title}
              demoUrl={publication.demoUrl}
              demoVideoUrl={publication.demoVideoUrl}
              projectType={publication.projectType}
            />
          </div>

          {premiumPreview && <UnlockedContent content={premiumPreview} />}

          <p className="border-t border-slate-800/80 pt-5 text-xs text-slate-500">
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
