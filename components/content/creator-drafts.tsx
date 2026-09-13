'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/use-auth';
import { marketplaceRequest, useWalletSession } from '@/lib/marketplace/client';
import { Button } from '@/components/ui/button';
import type { PublicationRecord } from '@/lib/supabase/types';
import { FileEdit } from 'lucide-react';

export function CreatorDrafts() {
  const authenticate = useWalletSession();
  const { authenticatedAddress, walletAddress } = useAuth();
  const address = walletAddress?.toLowerCase();
  const [items, setItems] = useState<PublicationRecord[]>([]);
  const [owner, setOwner] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadDrafts() {
    setBusy(true);
    setError('');
    try {
      await authenticate();
      const result = await marketplaceRequest('/publications?mine=true');
      setItems(result.publications || []);
      setOwner(address || '');
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load drafts');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Manage publications</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Access saved drafts, pending uploads, and manage published projects.
          </p>
        </div>
        <Button
          disabled={busy || !address}
          onClick={loadDrafts}
          className="gap-2"
        >
          <FileEdit className="h-3.5 w-3.5" />
          {busy
            ? 'Check wallet to sign...'
            : loaded && owner === address
            ? 'Refresh drafts'
            : 'Load drafts & projects'}
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      {loaded && owner === address && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">No saved drafts or pending projects found for this wallet.</p>
        </div>
      )}

      {owner === address && items.length > 0 && (
        <div className="grid gap-2.5 sm:grid-cols-2 pt-1">
          {items.map((p) => (
            <Link
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-100 transition-all group dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
              key={p.id}
              href={`/create?id=${p.id}`}
            >
              <span className="font-medium text-xs sm:text-sm text-zinc-800 group-hover:text-zinc-950 transition-colors dark:text-zinc-200 dark:group-hover:text-white">
                {p.title}
              </span>
              <span className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                {p.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
