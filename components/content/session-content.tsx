"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { demoPublications, getServerPublications, readAuthorDemo, loadSessionPremium } from "@/features/demo/publishing";
import { MembershipFlow } from "@/components/membership/membership-flow";
import { ExplorerReference } from "@/components/transaction/explorer-reference";
import { getCreatorByAddress } from "@/features/publications/repository";

export function SessionContent({ id }: { id: string }) {
  const publications = useSyncExternalStore(demoPublications.subscribe, demoPublications.getSnapshot, getServerPublications);
  const publication = publications.find((item) => item.id === id);
  if (!publication) return <div className="space-y-4"><h1 className="text-2xl font-semibold text-white">Demo publication unavailable</h1><p className="text-neutral-400">This publication exists only in the tab where it was created. Reloading clears the session.</p><Link className="inline-flex min-h-11 items-center text-red-300 underline" href="/dashboard">Back to Dashboard</Link></div>;
  const creator = getCreatorByAddress(publication.creatorAddress);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link className="inline-flex min-h-11 items-center text-red-300 underline" href="/">Back to Explore</Link>
      <h1 className="text-4xl font-semibold text-white">{publication.title}</h1>
      <Link className="inline-flex min-h-11 items-center text-neutral-300 underline" href={`/profile/${publication.creatorAddress}`}>{creator?.name ?? "Demo creator"}</Link>
      <h2 className="text-lg font-semibold text-neutral-200">Public preview</h2>
      <p className="whitespace-pre-wrap text-lg leading-loose text-neutral-300">{publication.preview}</p>
      {publication.proof ? (
        <>
          <ExplorerReference reference={publication.proof} />
          {publication.isGated && publication.lock ? (
            <MembershipFlow
              publicationId={id}
              creatorName={creator?.name ?? "Demo creator"}
              membership={{ price: publication.price, currency: "DEMO", durationDays: publication.durationDays, network: "hashkey", lock: publication.lock }}
              loadContent={() => loadSessionPremium(id)}
            />
          ) : (
            <section className="space-y-3">
              <h2 className="text-xl text-white">Public content</h2>
              <p className="whitespace-pre-wrap text-lg leading-loose text-neutral-300">{readAuthorDemo(id)}</p>
            </section>
          )}
        </>
      ) : <p role="status" className="text-neutral-400">Publication is still being prepared. Finish proof registration in Dashboard.</p>}
    </div>
  );
}
