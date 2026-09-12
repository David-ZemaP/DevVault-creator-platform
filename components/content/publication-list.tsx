"use client";

import { useState, useMemo } from "react";
import { BookOpen, Code2, FileText, Search, X } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search software, articles, creators..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-800/80 hover:text-slate-200"
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
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center">
          <BookOpen aria-hidden="true" className="mx-auto h-8 w-8 text-slate-500" />
          <h3 className="mt-4 text-lg font-semibold text-white">No publications found</h3>
          <p className="mt-1 text-sm text-slate-400">
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
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <ContentCard key={item.publication.id} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}
