"use client";

import React from "react";
import { Download, GitBranch, Lock, CheckCircle2, FileArchive, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SoftwareAssetsCardProps {
  isUnlocked: boolean;
  zipUrl?: string;
  repositoryUrl?: string;
  creatorAddress: string;
  publicationTitle: string;
}

export function SoftwareAssetsCard({
  isUnlocked,
  zipUrl,
  repositoryUrl,
}: SoftwareAssetsCardProps) {
  if (!zipUrl && !repositoryUrl) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <FileArchive className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-white">Software Source & Binaries</h4>
            <p className="text-[11px] text-zinc-400">
              {isUnlocked ? "Full repository and archive unlocked." : "Cryptographically locked until purchase."}
            </p>
          </div>
        </div>

        {isUnlocked ? (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Licensed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
            <Lock className="h-3 w-3" />
            Locked
          </span>
        )}
      </div>

      {isUnlocked ? (
        <div className="space-y-2.5 pt-1">
          {zipUrl && (
            <a
              href={zipUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button variant="primary" className="w-full gap-2 justify-center">
                <Download className="h-4 w-4" />
                Download Software Package (.zip)
              </Button>
            </a>
          )}

          {repositoryUrl && (
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button variant="outline" className="w-full gap-2 justify-center text-zinc-200 border-zinc-800 hover:border-zinc-700">
                <GitBranch className="h-4 w-4" />
                Access Full Source Repository
              </Button>
            </a>
          )}

          <div className="rounded-lg bg-zinc-950/80 border border-zinc-800/80 p-3 text-xs text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-300">License Terms:</div>
            <p>Non-exclusive software license. Verified on HashKey Chain with Unlock Protocol key.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Lock className="h-3.5 w-3.5 text-blue-400" />
              <span>Source files are hidden</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              To obtain the downloadable <span className="text-zinc-200 font-mono">.zip</span> archive or access the private repository, purchase an access key via HashKey Chain.
            </p>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500 border-t border-zinc-800/80">
              <Users className="h-3.5 w-3.5 text-zinc-400" />
              <span>Multiple buyers permitted. This product remains active after purchase.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
