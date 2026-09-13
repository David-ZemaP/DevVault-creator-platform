'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/use-auth';
import { formatEther } from 'viem';
import { marketplaceRequest, useWalletSession } from '@/lib/marketplace/client';
import { getHskExplorerTxUrl } from '@/lib/web3/hashkey';
import { Button } from '@/components/ui/button';
import type { PublicationRecord } from '@/lib/supabase/types';
import { ShoppingBag, Download } from 'lucide-react';

interface Purchase {
  id: string;
  project_id: string;
  buyer_wallet: string;
  seller_wallet: string;
  amount: string;
  purchased_at: string;
  transaction_hash: string;
  publication: PublicationRecord;
}

export function PurchaseLibrary({ sales = false }: { sales?: boolean }) {
  const authenticate = useWalletSession();
  const { authenticatedAddress, walletAddress } = useAuth();
  const [records, setRecords] = useState<Purchase[]>([]);
  const [owner, setOwner] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const address = walletAddress?.toLowerCase();

  const visible = owner === authenticatedAddress ? records : [];

  async function load() {
    setBusy(true);
    setError('');
    try {
      await authenticate();
      const data = await marketplaceRequest(`/purchases${sales ? '?sales=true' : ''}`);
      setRecords(data.purchases);
      setOwner(address || '');
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load purchases');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400">
            <ShoppingBag className="h-3.5 w-3.5 text-zinc-200" />
            <span>{sales ? 'Creator Studio' : 'Library'}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            {sales ? 'Creator sales' : 'My Purchases'}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            {sales
              ? 'Confirmed HSK payments. Totals are gross amounts paid, before protocol fees.'
              : 'Your purchased source archives remain available after membership expiration.'}
          </p>
        </div>

        <Button disabled={busy || !address} onClick={load} className="shrink-0">
          {busy
            ? 'Check wallet to sign...'
            : loaded && owner === authenticatedAddress
            ? sales ? 'Refresh sales' : 'Refresh purchases'
            : address
            ? sales ? 'Load sales' : 'Load purchases'
            : 'Connect wallet to continue'}
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
        >
          {error}
        </p>
      )}

      {loaded && owner === authenticatedAddress && !visible.length && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-10 text-center">
          <p className="text-xs text-zinc-400">No confirmed {sales ? 'sales' : 'purchases'} yet.</p>
        </div>
      )}

      {sales && visible.length > 0 && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-1.5">
          <p className="text-xs sm:text-sm font-medium text-white">
            {visible.length} purchases · {new Set(visible.map((r) => r.buyer_wallet)).size} buyers ·{' '}
            <span className="text-zinc-300">
              {formatEther(visible.reduce((total, r) => total + BigInt(r.amount), 0n))} HSK gross
            </span>
          </p>
          {Array.from(new Set(visible.map((r) => r.project_id))).map((id) => {
            const rows = visible.filter((r) => r.project_id === id);
            return (
              <p key={id} className="text-[11px] text-zinc-400">
                {rows[0].publication.title}: {rows.length} purchases ·{' '}
                {formatEther(rows.reduce((sum, r) => sum + BigInt(r.amount), 0n))} HSK gross
              </p>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((p) => (
          <article
            key={p.id}
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 space-y-3 shadow-sm transition-all hover:border-zinc-700"
          >
            {p.publication.coverImage && (
              <img
                src={p.publication.coverImage}
                alt=""
                className="aspect-video w-full rounded-lg object-cover border border-zinc-800"
              />
            )}
            <div>
              <h2 className="text-base font-semibold text-white">{p.publication.title}</h2>
              <p className="mt-0.5 break-all font-mono text-[11px] text-zinc-500">
                Creator: {p.seller_wallet}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
              <span>{formatEther(BigInt(p.amount))} HSK</span>
              <span className="text-zinc-600">·</span>
              <span className="text-[11px] font-normal text-zinc-400">
                {new Date(p.purchased_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-800/80">
              <a
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                href={getHskExplorerTxUrl(p.transaction_hash)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View transaction
              </a>
              {p.publication.status === 'PUBLISHED' && (
                <Link
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                  href={`/content/${p.project_id}`}
                >
                  Open project
                </Link>
              )}
            </div>

            {!sales && (
              <div className="pt-1">
                <Button
                  className="w-full gap-2 justify-center"
                  variant="primary"
                  onClick={async () => {
                    try {
                      await authenticate();
                      const source = await marketplaceRequest(
                        `/publications/${p.project_id}/source`
                      );
                      window.location.assign(source.url);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Download failed');
                    }
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Access source code
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
