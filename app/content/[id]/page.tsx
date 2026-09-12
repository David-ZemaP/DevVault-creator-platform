import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getPublicationById } from "@/features/publications/repository";
import { LockedContent } from "@/components/membership/locked-content";
import { UnlockedContent } from "@/components/content/unlocked-content";
import { AccessPreviewControls } from "@/components/membership/access-preview-controls";
import { getDevelopmentAccessPreview } from "@/features/publications/development-access-preview";
import { cn, formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = getPublicationById(id);
  return { title: result?.publication.title ?? "Publication not found", description: result?.publication.preview };
}

export default async function ContentDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const result = getPublicationById(id);
  if (!result) notFound();
  const { publication, creator } = result;
  const previewQuery = process.env.NODE_ENV === "development" ? await searchParams : undefined;
  const premiumPreview = await getDevelopmentAccessPreview(id, previewQuery?.previewAccess);

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-neutral-400 hover:text-white"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to Explore</Link>
      {process.env.NODE_ENV === "development" && (
        <AccessPreviewControls publicationId={id} isUnlocked={Boolean(premiumPreview)} />
      )}
      <div className={cn(
        "grid items-start gap-10 lg:gap-16",
        premiumPreview ? "mx-auto max-w-3xl" : "lg:grid-cols-[minmax(0,1fr)_340px]",
      )}>
        <article className="min-w-0">
          <header className="border-b border-neutral-800 pb-8">
            <p className="text-xs font-semibold tracking-widest text-red-400 uppercase">{publication.category}</p>
            <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-tight text-white sm:text-5xl">{publication.title}</h1>
            <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-neutral-400">
              <Link href={`/profile/${creator.address}`} className="flex items-center gap-3 rounded-lg text-neutral-200 hover:text-red-300"><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-xs font-semibold">{creator.initials}</span>{creator.name}</Link>
              <time dateTime={publication.publishedAt}>{formatDate(new Date(publication.publishedAt))}</time>
              <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-4 w-4" />{publication.readingMinutes} min read</span>
            </div>
          </header>
          <section aria-labelledby="preview-heading" className="py-8">
            <h2 id="preview-heading" className="text-sm font-semibold text-neutral-300">Public preview</h2>
            <p className="mt-4 text-lg leading-loose text-neutral-300">{publication.preview}</p>
          </section>
          {premiumPreview && <UnlockedContent content={premiumPreview} />}
          <p className="border-t border-neutral-800 pt-5 text-sm text-neutral-500">Demo publication · Content proof pending</p>
        </article>
        {!premiumPreview && <LockedContent creatorName={creator.name} membership={publication.membership} />}
      </div>
    </div>
  );
}
