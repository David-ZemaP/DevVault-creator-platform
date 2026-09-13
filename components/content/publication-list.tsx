"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Code2, FileText, PlusCircle, Search, X } from "lucide-react";
import type { PublicationSummary } from "@/features/publications/repository";
import { ContentCard } from "./content-card";
import { cn } from "@/lib/utils";

interface PublicationListProps {
  publications: readonly PublicationSummary[];
}

type FilterType = "all" | "software" | "article" | "subscription" | "lifetime";

export function PublicationList({ publications }: PublicationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    return publications.filter(({ publication, creator }) => {
      // Type filter
      if (activeFilter === "software" && publication.projectType !== "software") return false;
      if (activeFilter === "article" && publication.projectType === "software") return false;
      if (activeFilter === "subscription" && publication.acquisitionModel !== "subscription") return false;
      if (activeFilter === "lifetime" && publication.acquisitionModel === "subscription") return false;

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        publication.title.toLowerCase().includes(q) ||
        publication.preview.toLowerCase().includes(q) ||
        publication.category.toLowerCase().includes(q) ||
        creator.name.toLowerCase().includes(q) ||
        creator.address.toLowerCase().includes(q)
      );
    });
  }, [publications, searchQuery, activeFilter]);

  const filterButtons: { id: FilterType; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
    { id: "all", label: "All" },
    { id: "software", label: "Software", icon: Code2 },
    { id: "article", label: "Articles", icon: FileText },
    { id: "lifetime", label: "Lifetime" },
    { id: "subscription", label: "Subscriptions" },
  ];

  if (publications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 shadow-inner">
          <BookOpen aria-hidden="true" className="h-6 w-6 text-zinc-500" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-white">No publications published yet</h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm leading-relaxed text-zinc-400">
          There are no items registered in the database yet. Be the first creator to anchor cryptographic proofs on Avalanche and monetize via Unlock.
        </p>
        <div className="mt-6">
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-zinc-200 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Publish First Content</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search software, articles, creators..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 pl-9 pr-8 py-1.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-zinc-600 focus:bg-zinc-900 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterButtons.map(({ id, label, icon: Icon }) => {
            const isActive = activeFilter === id;
            return (
              <button
                key={id}
                onClick={() => setActiveFilter(id)}
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm"
                    : "border border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
                )}
              >
                {Icon && <Icon className="h-3 w-3" />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results view */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
          <BookOpen aria-hidden="true" className="mx-auto h-8 w-8 text-zinc-600" />
          <h3 className="mt-4 text-base font-semibold text-white">No publications found</h3>
          <p className="mt-1 text-xs text-zinc-400">
            {searchQuery
              ? `No results matching "${searchQuery}". Try a different keyword or filter.`
              : "No items match the selected filter."}
          </p>
          {(searchQuery || activeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <ContentCard key={item.publication.id} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
