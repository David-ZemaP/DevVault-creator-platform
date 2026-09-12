"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { keccak256, stringToBytes } from "viem";
import { Sparkles, Lock, Globe, ShieldCheck } from "lucide-react";

export default function CreatePublicationPage() {
  const { address, isConnected } = useAccount();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isGated, setIsGated] = useState(false);
  const [lockAddress, setLockAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successHash, setSuccessHash] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSubmitting(true);
    try {
      // Generate content proof hash
      const contentHash = keccak256(stringToBytes(content));
      console.log("Calculated Content Hash:", contentHash);

      // Simulating on-chain transaction or call to ContentProofRegistry
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccessHash(contentHash);
    } catch (err) {
      console.error("Publication error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b border-neutral-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Create Publication</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Publish content with cryptographic proof of authorship anchored on Avalanche.
        </p>
      </div>

      {successHash ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-neutral-200">
          <div className="flex items-center gap-2 font-semibold text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            Publication Proof Registered!
          </div>
          <p className="mt-2 text-sm text-neutral-300">
            Your content proof hash has been recorded:
          </p>
          <div className="mt-3 overflow-x-auto rounded bg-neutral-900 p-3 font-mono text-xs text-emerald-300">
            {successHash}
          </div>
          <div className="mt-6 flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setSuccessHash(null);
                setTitle("");
                setContent("");
                setDescription("");
              }}
            >
              Publish Another
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scaling Modular Subnets"
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Content (Markdown)</label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article, research notes, or publication content..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-red-500 focus:outline-none font-mono"
            />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isGated ? <Lock className="h-5 w-5 text-red-400" /> : <Globe className="h-5 w-5 text-neutral-400" />}
                <div>
                  <div className="text-sm font-medium text-white">
                    {isGated ? "Members-Only (Token-Gated)" : "Public Access"}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {isGated
                      ? "Only holders of an Unlock Protocol membership key can read this content."
                      : "Anyone on the web can read this publication for free."}
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
                <label className="text-xs font-medium text-neutral-300">Unlock Protocol Lock Address</label>
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
