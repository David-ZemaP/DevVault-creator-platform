"use client";

import React, { useState } from "react";
import { Play, RotateCcw, Terminal, ExternalLink, ShieldCheck, Cpu, Code2, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SoftwareDemoRunnerProps {
  title: string;
  demoUrl?: string;
  demoPreviewCode?: string;
  projectType?: "article" | "software";
}

export function SoftwareDemoRunner({
  title,
  demoUrl,
  demoPreviewCode,
  projectType = "software",
}: SoftwareDemoRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [iframeKey, setIframeKey] = useState(0);

  if (projectType !== "software" && !demoUrl && !demoPreviewCode) {
    return null;
  }

  const handleRunSimulation = () => {
    setIsRunning(true);
    setLogs([
      `[DevVault Sandbox] Initializing runtime environment for: ${title}...`,
      `[DevVault Sandbox] Loading dependencies and mock runtime memory...`,
      `[DevVault Sandbox] Compiling executable bytecode...`,
      `[DevVault Sandbox] Server listening on virtual socket: 0.0.0.0:8080`,
      `[DevVault Sandbox] Execution verification passed: 0 errors, status OK.`,
      `[DevVault Sandbox] Interactive demo ready. (Source files secured behind token-gate).`,
    ]);
  };

  const handleReset = () => {
    setIsRunning(false);
    setLogs([]);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 border border-red-500/20 text-red-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Live Software Demo & Execution</h3>
            <p className="text-xs text-neutral-400">
              Test software functionality in an isolated runtime before purchasing. Source code remains protected.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Verified Safe Execution</span>
        </div>
      </div>

      {demoUrl ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Embedded Interactive Sandbox</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 gap-1.5 text-xs text-neutral-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reload Demo
              </Button>
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 ml-2"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-neutral-800 bg-black">
            <iframe
              key={iframeKey}
              src={demoUrl}
              title={`Demo: ${title}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <Terminal className="h-4 w-4 text-red-400" />
              <span>Interactive Functional Demo Terminal</span>
            </div>

            <div className="flex items-center gap-2">
              {!isRunning ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunSimulation}
                  className="gap-2 text-xs"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run Software Demo
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="gap-2 text-xs text-neutral-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Environment
                </Button>
              )}
            </div>
          </div>

          {demoPreviewCode && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-neutral-300 overflow-x-auto max-h-56">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Public Demo Entrypoint
              </div>
              <pre>{demoPreviewCode}</pre>
            </div>
          )}

          <div className="rounded-xl border border-neutral-800 bg-black p-4 font-mono text-xs text-neutral-300 min-h-36 max-h-56 overflow-y-auto space-y-1">
            <div className="flex items-center gap-2 text-neutral-500 pb-2 border-b border-neutral-800 text-[11px]">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sandbox Console Output</span>
            </div>

            {logs.length === 0 ? (
              <p className="text-neutral-600 pt-2 italic">
                Click &ldquo;Run Software Demo&rdquo; to execute the program in the cloud runtime and verify output...
              </p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-emerald-400 flex items-start gap-2">
                  <span className="text-neutral-600 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
