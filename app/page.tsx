import Link from "next/link";
import { ArrowUpRight, Compass } from "lucide-react";
import { PublicationList } from "@/components/content/publication-list";
import { resolveAllPublications } from "@/features/publications/server-repository";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const publications = await resolveAllPublications();

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950/40 p-8 sm:p-10 backdrop-blur-md">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              <Compass aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Decentralized Creator Economy</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Software & Ideas. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-slate-200 bg-clip-text text-transparent">
                Proven onchain.
              </span>
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-slate-400">
              Discover software packages and articles from independent creators. Verify immutable proofs on Avalanche Fuji and purchase memberships on HashKey Chain.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-500 active:bg-blue-700"
          >
            <span>Publish Content</span>
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section aria-labelledby="publications-heading" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
          <div>
            <h2 id="publications-heading" className="text-xl font-bold tracking-tight text-white">
              Explore Publications
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Available software repositories, demos, and gated knowledge
            </p>
          </div>
          <span className="rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono text-xs text-slate-400">
            {publications.length} items total
          </span>
        </div>

        <PublicationList publications={publications} />
      </section>
    </div>
  );
}
