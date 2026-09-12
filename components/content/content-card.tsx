import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import type { PublicationSummary } from "@/features/publications/repository";
import { formatDate } from "@/lib/utils";

export function ContentCard({ publication, creator }: PublicationSummary) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 transition-colors hover:border-neutral-600">
      {publication.coverImage && <img src={publication.coverImage} alt="" className="mb-4 aspect-video w-full rounded-lg object-cover" />}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-medium text-neutral-400">{publication.category}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 font-medium text-red-300">
          <Lock aria-hidden="true" className="h-3 w-3" /> Locked
        </span>
      </div>
      <h2 className="mt-6 text-2xl leading-tight font-semibold tracking-tight text-white">
        <Link href={`/content/${publication.id}`} className="hover:text-red-300">{publication.title}</Link>
      </h2>
      <p className="mt-4 flex-1 text-base leading-relaxed text-neutral-400">{publication.preview}</p>
      <Link href={`/profile/${creator.address}`} className="mt-7 flex w-fit items-center gap-3 rounded-lg text-sm text-neutral-200 hover:text-white">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-xs font-semibold">{creator.initials}</span>
        <span>{creator.name}<span className="mt-0.5 block text-xs text-neutral-500"><time dateTime={publication.publishedAt}>{formatDate(new Date(publication.publishedAt))}</time> · {publication.readingMinutes} min read</span></span>
      </Link>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-5">
        <p className="text-sm font-medium text-neutral-200">{publication.membership.price} {publication.membership.currency}{publication.projectType !== "software" && <span className="font-normal text-neutral-500"> / {publication.membership.durationDays} days</span>}</p>
        <Link href={`/content/${publication.id}`} aria-label={`Read preview: ${publication.title}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-300">{publication.projectType === "software" ? "View Demo" : "Read preview"} <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
    </article>
  );
}
