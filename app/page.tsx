import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";
import { PublicationList } from "@/components/content/publication-list";
import { resolveAllPublications } from "@/features/publications/server-repository";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const publications = await resolveAllPublications();

  return (
    <div className="space-y-10">
      <header className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8 sm:p-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-300">
              <Compass aria-hidden="true" className="h-3.5 w-3.5 text-white" />
              <span>Decentralized Creator Economy</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Software & Ideas. <br className="hidden sm:inline" />
              <span className="text-zinc-400 font-normal">Proven onchain.</span>
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
              Discover software packages and articles from independent creators. Verify immutable proofs on
              Avalanche Fuji and purchase memberships on HashKey Chain.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 shadow-sm hover:bg-zinc-200 active:bg-zinc-300 transition-colors"
          >
            <span>Publish Content</span>
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section aria-labelledby="publications-heading" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <h2 id="publications-heading" className="text-lg font-semibold tracking-tight text-white">
              Explore Publications
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Available software repositories, demos, and gated knowledge
            </p>
          </div>
          <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-400">
            {publications.length} items total
          </span>
        </div>

        <PublicationList publications={publications} />
      </section>
    </div>
  );
}
