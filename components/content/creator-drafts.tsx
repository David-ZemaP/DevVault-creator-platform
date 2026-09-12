'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { marketplaceRequest, useWalletSession } from '@/lib/marketplace/client';
import { Button } from '@/components/ui/button';
import type { PublicationRecord } from '@/lib/supabase/types';
import { FileEdit } from 'lucide-react';

export function CreatorDrafts() {
  const authenticate = useWalletSession();
  const { address } = useAccount();
  const [items, setItems] = useState<PublicationRecord[]>([]);
  const [owner, setOwner] = useState('');
  const [error, setError] = useState('');

  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 space-y-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Manage publications</h2>
          <p className="text-xs text-zinc-400">
            Access saved drafts, pending uploads, and manage published projects.
          </p>
        </div>
        <Button
          onClick={async () => {
            try {
              await authenticate();
              const result = await marketplaceRequest('/publications?mine=true');
              setItems(result.publications);
              setOwner(address || '');
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Unable to load drafts');
            }
          }}
          className="gap-2"
        >
          <FileEdit className="h-3.5 w-3.5" />
          Sign in to load drafts and projects
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
          {error}
        </p>
      )}

      {owner === address && items.length > 0 && (
        <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
          {items.map((p) => (
            <Link
              className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all group"
              key={p.id}
              href={`/create?id=${p.id}`}
            >
              <span className="font-medium text-xs sm:text-sm text-zinc-200 group-hover:text-white transition-colors">
                {p.title}
              </span>
              <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                {p.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
