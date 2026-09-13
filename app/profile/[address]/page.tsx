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
    <div className="space-y-8">
      <header className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-800 text-xl font-semibold text-neutral-300"
          >
            {initials}
          </span>
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{displayName}</h1>
            <p className="text-base text-neutral-400">{bio}</p>
            <p className="font-mono text-xs text-neutral-500">{address.toLowerCase()}</p>
          </div>
        </div>
      </header>
      <section aria-labelledby="creator-publications" className="space-y-5">
        <h2 id="creator-publications" className="text-xl font-semibold text-white">
          Publications by {displayName}
        </h2>
        <PublicationList publications={publications} />
      </section>
    </div>
  );
}
