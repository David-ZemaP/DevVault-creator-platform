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
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
            <FileArchive className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Software Source & Binaries</h4>
            <p className="text-xs text-slate-400">
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
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
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
              <Button variant="outline" className="w-full gap-2 justify-center text-white border-slate-700 hover:border-slate-500">
                <GitBranch className="h-4 w-4" />
                Access Full Source Repository
              </Button>
            </a>
          )}

          <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">License Terms:</div>
            <p>Non-exclusive software license. Verified on HashKey Chain with Unlock Protocol key.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Lock className="h-4 w-4 text-blue-400" />
              <span>Source files are hidden</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              To obtain the downloadable <span className="text-slate-200 font-mono">.zip</span> archive or access the private repository, purchase an access key via HashKey Chain.
            </p>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-800/80">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span>Multiple buyers permitted. This product remains active after purchase.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
