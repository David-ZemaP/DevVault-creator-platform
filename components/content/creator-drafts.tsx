'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { marketplaceRequest, useWalletSession } from '@/lib/marketplace/client';
import { Button } from '@/components/ui/button';
import type { PublicationRecord } from '@/lib/supabase/types';
import { FileEdit, ShieldAlert } from 'lucide-react';

export function CreatorDrafts() {
  const authenticate = useWalletSession();
  const { address } = useAccount();
  const [items, setItems] = useState<PublicationRecord[]>([]);
  const [owner, setOwner] = useState('');
  const [error, setError] = useState('');

  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Manage publications</h2>
          <p className="text-xs text-slate-400 mt-1">
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
          <FileEdit className="h-4 w-4" />
          Sign in to load drafts and projects
        </Button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
          {error}
        </p>
      )}

      {owner === address && items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          {items.map((p) => (
            <Link
              className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-slate-200 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all group"
              key={p.id}
              href={`/create?id=${p.id}`}
            >
              <span className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                {p.title}
              </span>
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
                {p.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
