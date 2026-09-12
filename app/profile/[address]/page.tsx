import { notFound } from "next/navigation";
import { formatAddress } from "@/lib/utils";
import { PublicationList } from "@/components/content/publication-list";
import { getCreatorByAddress, listPublications } from "@/features/publications/repository";

interface PageProps {
  params: Promise<{ address: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { address } = await params;
  const creator = getCreatorByAddress(address);
  if (!creator) notFound();

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-900/50 to-slate-900 text-xl font-bold text-blue-300 shadow-inner"
          >
            {creator.initials}
          </span>
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase">
              Creator Profile
            </p>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{creator.name}</h1>
            <p className="text-base text-slate-300">{creator.bio}</p>
            <p className="font-mono text-xs text-slate-400">{formatAddress(creator.address)}</p>
          </div>
        </div>
      </header>
      <section aria-labelledby="creator-publications" className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 id="creator-publications" className="text-xl font-bold text-white">
            Publications by {creator.name}
          </h2>
        </div>
        <PublicationList publications={listPublications(creator.address)} />
      </section>
    </div>
  );
}
