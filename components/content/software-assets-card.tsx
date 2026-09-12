"use client";

import React from "react";
import { Download, GitBranch, Lock, CheckCircle2, FileArchive, Code, Users } from "lucide-react";
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
  creatorAddress,
  publicationTitle,
}: SoftwareAssetsCardProps) {
  if (!zipUrl && !repositoryUrl) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
            <FileArchive className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Software Source & Binaries</h4>
            <p className="text-xs text-neutral-400">
              {isUnlocked ? "Full repository and archive unlocked." : "Cryptographically locked until purchase."}
            </p>
          </div>
        </div>

        {isUnlocked ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Licensed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
            <Lock className="h-3.5 w-3.5" />
            Locked
          </span>
        )}
      </div>

      {isUnlocked ? (
        <div className="space-y-3 pt-2">
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
              <Button variant="outline" className="w-full gap-2 justify-center text-white border-neutral-700 hover:border-neutral-500">
                <GitBranch className="h-4 w-4" />
                Access Full Source Repository
              </Button>
            </a>
          )}

          <div className="rounded-lg bg-neutral-950 p-3 text-xs text-neutral-400 space-y-1">
            <div className="font-semibold text-neutral-300">License Terms:</div>
            <p>Non-exclusive software license. Verified on HashKey Chain with Unlock Protocol key.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
              <Lock className="h-4 w-4 text-red-400" />
              <span>Source files are hidden</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              To obtain the downloadable <span className="text-neutral-200 font-mono">.zip</span> archive or access the private repository, purchase an access key via HashKey Chain.
            </p>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-500 border-t border-neutral-800/80">
              <Users className="h-3.5 w-3.5 text-neutral-400" />
              <span>Multiple buyers permitted. This product remains active after purchase.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
