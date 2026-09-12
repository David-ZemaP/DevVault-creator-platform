'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { marketplaceRequest, useWalletSession } from '@/lib/marketplace/client';
import { getHskExplorerTxUrl } from '@/lib/web3/hashkey';
import { Button } from '@/components/ui/button';
import type { PublicationRecord } from '@/lib/supabase/types';
import { ShoppingBag, ExternalLink, Download, ArrowRight, ShieldCheck } from 'lucide-react';

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
  const { address } = useAccount();
  const [records, setRecords] = useState<Purchase[]>([]);
  const [owner, setOwner] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const visible = owner === address ? records : [];

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
            <ShoppingBag className="h-4 w-4" />
            <span>{sales ? 'Creator Studio' : 'Library'}</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            {sales ? 'Creator sales' : 'My Purchases'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {sales
              ? 'Confirmed HSK payments. Totals are gross amounts paid, before protocol fees.'
              : 'Your purchased source archives remain available after membership expiration.'}
          </p>
        </div>

        <Button disabled={busy || !address} onClick={load} className="shrink-0">
          {busy ? 'Loading...' : address ? 'Sign in / refresh' : 'Connect wallet to continue'}
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
        >
          {error}
        </p>
      )}

      {loaded && owner === address && !visible.length && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center">
          <p className="text-slate-400">No confirmed {sales ? 'sales' : 'purchases'} yet.</p>
        </div>
      )}

      {sales && visible.length > 0 && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-2">
          <p className="text-sm font-semibold text-white">
            {visible.length} purchases · {new Set(visible.map((r) => r.buyer_wallet)).size} buyers ·{' '}
            <span className="text-blue-400">
              {formatEther(visible.reduce((total, r) => total + BigInt(r.amount), 0n))} HSK gross
            </span>
          </p>
          {Array.from(new Set(visible.map((r) => r.project_id))).map((id) => {
            const rows = visible.filter((r) => r.project_id === id);
            return (
              <p key={id} className="text-xs text-slate-400">
                {rows[0].publication.title}: {rows.length} purchases ·{' '}
                {formatEther(rows.reduce((sum, r) => sum + BigInt(r.amount), 0n))} HSK gross
              </p>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {visible.map((p) => (
          <article
            key={p.id}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 space-y-4 shadow-sm transition-all hover:border-slate-700/80"
          >
            {p.publication.coverImage && (
              <img
                src={p.publication.coverImage}
                alt=""
                className="aspect-video w-full rounded-xl object-cover border border-slate-800/60"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{p.publication.title}</h2>
              <p className="mt-1 break-all font-mono text-xs text-slate-400">
                Creator: {p.seller_wallet}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="text-blue-400">{formatEther(BigInt(p.amount))} HSK</span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-normal text-slate-400">
                {new Date(p.purchased_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800">
              <a
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
                href={getHskExplorerTxUrl(p.transaction_hash)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View transaction
              </a>
              {p.publication.status === 'PUBLISHED' && (
                <Link
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
                  href={`/content/${p.project_id}`}
                >
                  Open project
                </Link>
              )}
            </div>

            {!sales && (
              <div className="pt-2">
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
                  <Download className="h-4 w-4" />
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
