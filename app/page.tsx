import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicationList } from "@/components/content/publication-list";
import { resolveAllPublications } from "@/features/publications/server-repository";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const publications = await resolveAllPublications();

  return (
    <div className="space-y-12">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/40 via-zinc-950/60 to-zinc-950 px-6 py-12 sm:px-12 sm:py-16 text-center">
        {/* Subtle, soft ambient illumination */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-48 w-80 rounded-full bg-zinc-700/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-xs font-medium text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Decentralized Creator Economy</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
            Software & Ideas. <br />
            <span className="text-zinc-400 font-normal">Proven onchain.</span>
          </h1>

          <p className="max-w-xl text-sm sm:text-base leading-relaxed text-zinc-400">
            Discover software packages and articles from independent creators. Verify immutable proofs on Avalanche Fuji and purchase memberships on HashKey Chain.
          </p>

          <div className="pt-2">
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-md hover:bg-zinc-200 active:scale-[0.98] transition-all"
            >
              <span>Publish Content</span>
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
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
