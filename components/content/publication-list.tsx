import { BookOpen } from "lucide-react";
import type { PublicationSummary } from "@/features/publications/repository";
import { ContentCard } from "./content-card";

interface PublicationListProps {
  publications: readonly PublicationSummary[];
}

export function PublicationList({ publications }: PublicationListProps) {
  if (publications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-700 px-6 py-16 text-center">
        <BookOpen aria-hidden="true" className="mx-auto h-8 w-8 text-neutral-500" />
        <h2 className="mt-4 text-xl font-semibold text-white">No publications yet</h2>
        <p className="mt-2 text-base text-neutral-400">New stories will appear here when they are published.</p>
      </div>
    );
  }

  return <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{publications.map((item) => <ContentCard key={item.publication.id} {...item} />)}</div>;
}
