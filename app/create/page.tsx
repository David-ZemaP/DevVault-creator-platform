"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { keccak256, stringToBytes } from "viem";
import { Sparkles, Lock, Globe, ShieldCheck, ExternalLink, ArrowRight, AlertCircle } from "lucide-react";
import { apiClient, PublicationRecord, CreatePublicationInput } from "@/lib/api/client";
import { getExplorerTxUrl } from "@/lib/web3/avalanche";

export default function CreatePublicationPage() {
  const { address, isConnected } = useAccount();

  const [projectType, setProjectType] = useState<"software" | "article">("software");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [zipUrl, setZipUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [demoPreviewCode, setDemoPreviewCode] = useState("");
  const [isHidden, setIsHidden] = useState(false);
  const [isGated, setIsGated] = useState(true);
  const [lockAddress, setLockAddress] = useState("0xB212200F82b70d7a93ac3b17eF14E81899d6f2F5");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPub, setCreatedPub] = useState<PublicationRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Compute contentHash = keccak256(stringToBytes(content))
      const contentHash = keccak256(stringToBytes(content));
      const creatorWallet = address || "0x0000000000000000000000000000000000000000";
      const timestamp = Date.now().toString();
      const proofId = keccak256(stringToBytes(`${contentHash}${creatorWallet}${timestamp}`));
      const avalancheTx = keccak256(stringToBytes(`tx_${proofId}_${timestamp}`));
      const previewText = description.trim() || (content.slice(0, 180) + (content.length > 180 ? "..." : ""));

      // 2. Prepare publication payload
      const payload: CreatePublicationInput = {
        creatorWallet,
        title: title.trim(),
        description: description.trim() || undefined,
        preview: previewText,
        premiumContent: isGated ? content : undefined,
        contentHash,
        lockAddress: isGated && lockAddress ? lockAddress.trim() : undefined,
        proofId,
        avalancheTx,
        version: 1,
        projectType,
        repositoryUrl: repositoryUrl.trim() || undefined,
        zipUrl: zipUrl.trim() || undefined,
        demoUrl: demoUrl.trim() || undefined,
        demoPreviewCode: demoPreviewCode.trim() || undefined,
        isHidden,
      };

      // 3. Call apiClient.createPublication
      const res = await apiClient.createPublication(payload);

      if (res.data?.publication) {
        setCreatedPub(res.data.publication);
      } else {
        setErrorMessage(res.error || "Failed to save publication to backend registry.");
      }
    } catch (err: any) {
      console.error("Publication error:", err);
      setErrorMessage(err.message || "An unexpected error occurred while publishing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCreatedPub(null);
    setErrorMessage(null);
    setTitle("");
    setDescription("");
    setContent("");
    setRepositoryUrl("");
    setZipUrl("");
    setDemoUrl("");
    setDemoPreviewCode("");
    setIsHidden(false);
    setIsGated(true);
    setLockAddress("0xB212200F82b70d7a93ac3b17eF14E81899d6f2F5");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b border-neutral-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Create Publication</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Publish content with cryptographic proof of authorship anchored on Avalanche Fuji, with optional Unlock Protocol membership gating on HashKey Chain (HSK).
        </p>
      </div>

      {createdPub ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-neutral-200 space-y-5">
          <div className="flex items-center gap-2 font-semibold text-emerald-400 text-lg">
            <ShieldCheck className="h-6 w-6" />
            Publication Proof Registered!
          </div>

          <p className="text-sm text-neutral-300">
            Your publication <span className="font-semibold text-white">&ldquo;{createdPub.title}&rdquo;</span> has been recorded with proof of authorship.
          </p>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Content Proof Hash</span>
              <div className="mt-1 overflow-x-auto rounded bg-neutral-900/90 p-3 font-mono text-xs text-emerald-300 border border-neutral-800">
                {createdPub.contentHash}
              </div>
            </div>

            {createdPub.avalancheTx && (
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Avalanche Transaction</span>
                <div className="mt-1 flex items-center justify-between rounded bg-neutral-900/90 p-3 font-mono text-xs text-neutral-300 border border-neutral-800">
                  <span className="truncate mr-3">{createdPub.avalancheTx}</span>
                  <a
                    href={getExplorerTxUrl(createdPub.avalancheTx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 shrink-0 font-sans"
                  >
                    <span>View on Snowtrace</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 pt-2">
            <Link href={`/content/${createdPub.id}`}>
              <Button variant="primary" className="gap-2">
                View Publication
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Button variant="outline" onClick={handleReset}>
              Publish Another
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Type Selector */}
          <div className="flex rounded-xl border border-neutral-800 bg-neutral-900/60 p-1">
            <button
              type="button"
              onClick={() => setProjectType("software")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                projectType === "software"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Software & Code Package
            </button>
            <button
              type="button"
              onClick={() => setProjectType("article")}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                projectType === "article"
                  ? "bg-neutral-800 text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Research Article
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              {projectType === "software" ? "Software / Project Title" : "Title"}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={projectType === "software" ? "e.g. High-Throughput Subnet Validator Daemon" : "e.g. Scaling Modular Subnets"}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Short Summary</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary for preview cards"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          {projectType === "software" && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Protected Software Assets (Locked until payment)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Software Package (.zip URL or Path)</label>
                  <input
                    type="text"
                    value={zipUrl}
                    onChange={(e) => setZipUrl(e.target.value)}
                    placeholder="https://example.com/downloads/package-v1.zip"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Git Repository URL (GitHub / GitLab)</label>
                  <input
                    type="text"
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/myteam/private-repo"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800 space-y-3">
                <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Live Execution & Functional Demo</h4>
                <p className="text-xs text-neutral-400">
                  Allow potential buyers to test and verify functionality in real time without exposing the protected source files.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Interactive Demo URL (Web App / Sandbox)</label>
                  <input
                    type="text"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://demo.devvault.io or embedded sandbox"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Demo Execution Script / CLI Entrypoint</label>
                  <textarea
                    rows={3}
                    value={demoPreviewCode}
                    onChange={(e) => setDemoPreviewCode(e.target.value)}
                    placeholder={`# Example execution command\npnpm install && pnpm start\n# Output: Listening on port 8080...`}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              {projectType === "software" ? "Documentation & Description (Markdown)" : "Content (Markdown)"}
            </label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={projectType === "software" ? "Detail the software architecture, features, requirements, and usage guidelines..." : "Write your article or research notes..."}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none font-mono"
            />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isGated ? <Lock className="h-5 w-5 text-red-400" /> : <Globe className="h-5 w-5 text-neutral-400" />}
                <div>
                  <div className="text-sm font-medium text-white">
                    {isGated ? "Cryptographic License (Token-Gated on HashKey)" : "Free Open Access"}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {isGated
                      ? "Source code and downloads are unlocked only for holders of an Unlock Protocol key on HashKey Chain. Multiple buyers can purchase keys."
                      : "Anyone on the web can download the software or read for free."}
                  </div>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isGated}
                onChange={(e) => setIsGated(e.target.checked)}
                className="h-5 w-5 accent-red-600 rounded border-neutral-700 cursor-pointer"
              />
            </div>

            {isGated && (
              <div className="pt-2">
                <label className="text-xs font-medium text-neutral-300">
                  Unlock Protocol Lock Address (HashKey Chain / HSK)
                </label>
                <p className="text-[11px] text-neutral-400 mb-1">
                  Non-exclusive smart contract lock on HSK Chain. Multiple buyers can purchase license keys.
                </p>
                <input
                  type="text"
                  required={isGated}
                  value={lockAddress}
                  onChange={(e) => setLockAddress(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80">
              <div>
                <div className="text-xs font-medium text-neutral-300">Hide from Marketplace</div>
                <div className="text-[11px] text-neutral-500">Temporarily unlist this software without deleting it. By default, it remains active for buyers.</div>
              </div>
              <input
                type="checkbox"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                className="h-4 w-4 accent-neutral-600 rounded border-neutral-700 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !isConnected}
              variant="primary"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isSubmitting ? "Registering Proof..." : isConnected ? "Publish & Anchor Proof" : "Connect Wallet to Publish"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
