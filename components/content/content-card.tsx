import Link from "next/link";
import { ArrowUpRight, Code2, FileText, Lock } from "lucide-react";
import type { PublicationSummary } from "@/features/publications/repository";
import { formatDate } from "@/lib/utils";

export function ContentCard({ publication, creator }: PublicationSummary) {
  const isSoftware = publication.projectType === "software";
  const isSubscription = publication.acquisitionModel === "subscription";

  return (
    <article className="group flex min-w-0 flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-150 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60">
      <div>
        {publication.coverImage && (
          <div className="mb-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <img
              src={publication.coverImage}
              alt=""
              className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-101"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 text-[11px] dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
              {isSoftware ? (
                <>
                  <Code2 className="h-3 w-3 text-zinc-600 dark:text-zinc-200" />
                  <span>Software</span>
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                  <span>Article</span>
                </>
              )}
            </span>

            <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-medium text-zinc-600 text-[11px] dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-400">
              {isSubscription ? "Subscription" : "Lifetime"}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-400">
            <Lock aria-hidden="true" className="h-2.5 w-2.5 text-zinc-400" />
            <span>Gated</span>
          </span>
        </div>

        <h3 className="mt-3.5 text-base font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-white">
          <Link href={`/content/${publication.id}`} className="focus-visible:outline-none">
            {publication.title}
          </Link>
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-3">
          {publication.preview}
        </p>
      </div>

      <div className="mt-5">
        <Link
          href={`/profile/${creator.address}`}
          className="flex w-fit items-center gap-2 rounded text-xs text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition-colors"
        >
          <span
            aria-hidden="true"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 font-mono text-[9px] font-bold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {creator.initials}
          </span>
          <div>
            <span className="font-medium text-zinc-900 dark:text-zinc-200">{creator.name}</span>
            <span className="block text-[10px] text-zinc-500">
              <time dateTime={publication.publishedAt}>{formatDate(new Date(publication.publishedAt))}</time>
              {" · "}
              {isSoftware ? "Software package" : `${publication.readingMinutes} min read`}
            </span>
          </div>
        </Link>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80 pt-3.5">
          <div>
            <span className="text-[10px] text-zinc-500 block">Access price</span>
            <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {publication.membership.price} {publication.membership.currency}
              {isSubscription && <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400"> / 30d</span>}
            </p>
          </div>

          <Link
            href={`/content/${publication.id}`}
            aria-label={`View ${publication.title}`}
            className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <span>{isSoftware ? "View Demo" : "Preview"}</span>
            <ArrowUpRight aria-hidden="true" className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
          </Link>
        </div>
      </div>
    </article>
  );
}
