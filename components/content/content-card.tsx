import Link from "next/link";
import { ArrowUpRight, Code2, FileText, Lock, ShieldCheck } from "lucide-react";
import type { PublicationSummary } from "@/features/publications/repository";
import { formatDate } from "@/lib/utils";

export function ContentCard({ publication, creator }: PublicationSummary) {
  const isSoftware = publication.projectType === "software";
  const isSubscription = publication.acquisitionModel === "subscription";

  return (
    <article className="group flex min-w-0 flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-blue-950/20">
      <div>
        {publication.coverImage && (
          <div className="mb-4 overflow-hidden rounded-xl border border-slate-800">
            <img
              src={publication.coverImage}
              alt=""
              className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800/60 px-2 py-0.5 font-medium text-slate-300">
              {isSoftware ? (
                <>
                  <Code2 className="h-3 w-3 text-blue-400" />
                  <span>Software</span>
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 text-slate-400" />
                  <span>Article</span>
                </>
              )}
            </span>

            {isSubscription ? (
              <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-medium text-indigo-300">
                Subscription
              </span>
            ) : (
              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-300">
                Lifetime
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-800/40 px-2 py-0.5 text-[11px] font-medium text-slate-400">
            <Lock aria-hidden="true" className="h-3 w-3 text-slate-400" />
            <span>Gated</span>
          </span>
        </div>

        <h3 className="mt-4 text-xl font-bold tracking-tight text-white transition-colors group-hover:text-blue-400">
          <Link href={`/content/${publication.id}`} className="focus-visible:outline-none">
            {publication.title}
          </Link>
        </h3>

        <p className="mt-2.5 text-sm leading-relaxed text-slate-400 line-clamp-3">
          {publication.preview}
        </p>
      </div>

      <div className="mt-6">
        <Link
          href={`/profile/${creator.address}`}
          className="flex w-fit items-center gap-2.5 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 font-mono text-[10px] font-bold text-slate-200"
          >
            {creator.initials}
          </span>
          <div>
            <span className="font-medium text-slate-200">{creator.name}</span>
            <span className="block text-[11px] text-slate-500">
              <time dateTime={publication.publishedAt}>{formatDate(new Date(publication.publishedAt))}</time>
              {" · "}
              {isSoftware ? "Software package" : `${publication.readingMinutes} min read`}
            </span>
          </div>
        </Link>

        <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-4">
          <div>
            <span className="text-xs text-slate-500 block">Access price</span>
            <p className="text-sm font-bold text-slate-100">
              {publication.membership.price} {publication.membership.currency}
              {isSubscription && <span className="text-xs font-normal text-slate-400"> / 30d</span>}
            </p>
          </div>

          <Link
            href={`/content/${publication.id}`}
            aria-label={`View ${publication.title}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:border-blue-500/40 hover:bg-blue-600/10 hover:text-blue-300"
          >
            <span>{isSoftware ? "View Demo" : "Preview"}</span>
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
