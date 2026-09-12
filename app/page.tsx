import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";
import { PublicationList } from "@/components/content/publication-list";
import { resolveAllPublications } from "@/features/publications/server-repository";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const publications = await resolveAllPublications();

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-6 border-b border-neutral-800 pb-8 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-red-400 uppercase">
            <Compass aria-hidden="true" className="h-4 w-4" />
            Independent voices. Shared knowledge.
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Find your next deep dive.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-neutral-400">
            Discover ideas from independent creators. Read a preview, find your community, and explore what membership unlocks across Avalanche Fuji and HashKey Chain.
          </p>
        </div>
        <Link
          href="/create"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Create a publication <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </header>
      <section aria-labelledby="publications-heading" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="publications-heading" className="text-lg font-semibold text-neutral-100">
            Latest publications
          </h2>
          <span className="text-sm text-neutral-500">{publications.length} stories to explore</span>
        </div>
        <PublicationList publications={publications} />
      </section>
    </div>
  );
}
