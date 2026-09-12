import React from "react";
import Link from "next/link";
import { formatAddress, formatDate } from "@/lib/utils";
import { Lock, FileText, CheckCircle2 } from "lucide-react";

export interface ContentCardProps {
  id: string;
  title: string;
  description?: string;
  author: string;
  createdAt: number | string;
  isGated: boolean;
  lockAddress?: string;
}

export function ContentCard({
  id,
  title,
  description,
  author,
  createdAt,
  isGated,
}: ContentCardProps) {
  const timestamp =
    typeof createdAt === "string"
      ? Math.floor(new Date(createdAt).getTime() / 1000) || Math.floor(Date.now() / 1000)
      : createdAt;
  return (
    <article className="group relative rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-neutral-700 hover:bg-neutral-900">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Link
            href={`/profile/${author}`}
            className="hover:text-red-400 font-mono transition-colors"
          >
            {formatAddress(author)}
          </Link>
          <span>•</span>
          <time dateTime={new Date(timestamp * 1000).toISOString()}>
            {formatDate(timestamp)}
          </time>
        </div>

        {isGated ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
            <Lock className="h-3 w-3" />
            Members Only
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Public
          </span>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-neutral-100 group-hover:text-red-400 transition-colors">
          <Link href={`/content/${id}`}>{title}</Link>
        </h3>
        <p className="mt-2 text-sm text-neutral-400 line-clamp-2">{description}</p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-neutral-800/80 pt-4 text-xs text-neutral-500">
        <div className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          <span>Proof Verified</span>
        </div>
        <Link
          href={`/content/${id}`}
          className="text-xs font-medium text-red-400 hover:text-red-300"
        >
          View details →
        </Link>
      </div>
    </article>
  );
}
