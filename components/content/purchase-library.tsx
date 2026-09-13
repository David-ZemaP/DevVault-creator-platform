'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/use-auth';
import { formatEther } from 'viem';
import { marketplaceRequest, useWalletSession } from '@/lib/marketplace/client';
import { getHskExplorerTxUrl } from '@/lib/web3/hashkey';
import { Button } from '@/components/ui/button';
import type { PublicationRecord } from '@/lib/supabase/types';
interface Purchase { id: string; project_id: string; buyer_wallet: string; seller_wallet: string; amount: string; purchased_at: string; transaction_hash: string; publication: PublicationRecord }
export function PurchaseLibrary({ sales = false }: { sales?: boolean }) {
  const authenticate = useWalletSession(), { authenticatedAddress, walletAddress } = useAuth();
  const [records, setRecords] = useState<Purchase[]>([]), [owner, setOwner] = useState(''), [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const address = walletAddress?.toLowerCase();
  const visible = owner === authenticatedAddress ? records : [];
  async function load() {
    setBusy(true); setError('');
    try { await authenticate(); const data = await marketplaceRequest(`/purchases${sales ? '?sales=true' : ''}`); setRecords(data.purchases); setOwner(address || ''); setLoaded(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load purchases'); } finally { setBusy(false); }
  }
  return <section className="space-y-5">
    <h1 className="text-2xl font-semibold">{sales ? 'Creator sales' : 'My Purchases'}</h1>
    <p className="text-neutral-400">{sales ? 'Confirmed initial HSK purchases. Totals exclude renewals and are shown before protocol fees.' : 'Lifetime purchases remain available after membership expiration. Subscription projects require active membership.'}</p>
    <Button disabled={busy || !address} onClick={load}>{busy ? 'Loading...' : address ? 'Sign in / refresh' : 'Connect wallet to continue'}</Button>
    {error && <p role="alert">{error}</p>}
    {loaded && owner === authenticatedAddress && !visible.length && <p>No confirmed {sales ? 'sales' : 'purchases'} yet.</p>}
    {sales && visible.length > 0 && <p>{visible.length} purchases · {new Set(visible.map(r => r.buyer_wallet)).size} buyers · {formatEther(visible.reduce((total, r) => total + BigInt(r.amount), 0n))} HSK gross</p>}
    {sales && Array.from(new Set(visible.map(r => r.project_id))).map(id => {
      const rows = visible.filter(r => r.project_id === id);
      return <p key={id}>{rows[0].publication.title}: {rows.length} purchases · {formatEther(rows.reduce((sum, r) => sum + BigInt(r.amount), 0n))} HSK gross</p>;
    })}
    <div className="grid gap-5 sm:grid-cols-2">{visible.map(p => <article key={p.id} className="rounded-xl border border-neutral-800 p-5 space-y-3">
      {p.publication.coverImage && <img src={p.publication.coverImage} alt="" className="aspect-video w-full rounded-lg object-cover" />}
      <h2 className="text-xl font-semibold">{p.publication.title}</h2>
      <p className="break-all text-sm text-neutral-400">Creator: {p.seller_wallet}</p>
      <p>{formatEther(BigInt(p.amount))} HSK · {new Date(p.purchased_at).toLocaleDateString()}</p>
      <a className="block text-red-400" href={getHskExplorerTxUrl(p.transaction_hash)} target="_blank" rel="noopener noreferrer">View transaction</a>
      {p.publication.status === 'PUBLISHED' && <Link className="block text-red-400" href={`/content/${p.project_id}`}>Open project</Link>}
      {!sales && <Button onClick={async () => { try { await authenticate(); const source = await marketplaceRequest(`/publications/${p.project_id}/source`); window.location.assign(source.url); } catch (e) { setError(e instanceof Error ? e.message : 'Download failed'); } }}>Access source code</Button>}
    </article>)}</div>
  </section>;
}
