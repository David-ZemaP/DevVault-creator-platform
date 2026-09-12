import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getPublicationById } from "@/features/publications/repository";
import { MembershipFlow } from "@/components/membership/membership-flow";
import { SessionContent } from "@/components/content/session-content";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (process.env.NODE_ENV === "development" && /^demo-[\da-f-]{36}$/.test(id)) return { title: "Demo publication" };
  const result = getPublicationById(id);
  return { title: result?.publication.title ?? "Publication not found", description: result?.publication.preview };
}

export default async function ContentDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (process.env.NODE_ENV === "development" && /^demo-[\da-f-]{36}$/.test(id)) return <SessionContent id={id} />;
  const result = getPublicationById(id);
  if (!result) notFound();
  const { publication, creator } = result;

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-neutral-400 hover:text-white"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to Explore</Link>
      <div className="mx-auto max-w-3xl space-y-8">
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
          <p className="border-t border-neutral-800 pt-5 text-sm text-neutral-500">Demo publication · Content proof pending</p>
        </article>
        <MembershipFlow publicationId={id} creatorName={creator.name} membership={publication.membership} />
      </div>
    </div>
  );
}
