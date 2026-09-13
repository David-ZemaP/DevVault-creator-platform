import { notFound } from "next/navigation";
import { formatAddress } from "@/lib/utils";
import { PublicationList } from "@/components/content/publication-list";
import { resolveAllPublications, resolveCreator } from "@/features/publications/server-repository";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ address: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { address } = await params;

  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) notFound();

  const [creator, publications] = await Promise.all([
    resolveCreator(address),
    resolveAllPublications(address),
  ]);

  if (!creator && publications.length === 0) notFound();

  const displayName = creator?.name ?? formatAddress(address as `0x${string}`);
  const initials = creator?.initials ?? address.slice(2, 4).toUpperCase();
  const bio = creator?.bio ?? "Creator on DevVault";

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:shadow-none">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-300 bg-zinc-100 text-base font-bold text-zinc-800 font-mono dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {initials}
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Creator Profile
            </p>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white sm:text-2xl">{displayName}</h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">{bio}</p>
            <p className="font-mono text-xs text-zinc-500">{formatAddress(address as `0x${string}`)}</p>
          </div>
        </div>
      </header>
      <section aria-labelledby="creator-publications" className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800/80">
          <h2 id="creator-publications" className="text-base font-semibold text-zinc-900 dark:text-white">
            Publications by {displayName}
          </h2>
        </div>
        <PublicationList publications={publications} />
      </section>
    </div>
  );
}
