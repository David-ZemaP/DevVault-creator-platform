'use client';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { marketplaceRequest, useWalletSession } from '@/lib/marketplace/client';
import { Button } from '@/components/ui/button';
import type { PublicationRecord } from '@/lib/supabase/types';
export function CreatorDrafts() {
  const authenticate = useWalletSession(), { address } = useAccount();
  const [items, setItems] = useState<PublicationRecord[]>([]), [owner, setOwner] = useState(''), [error, setError] = useState('');
  return <section className="space-y-4"><h2 className="text-xl font-semibold">Manage publications</h2><Button onClick={async () => { try { await authenticate(); const result = await marketplaceRequest('/publications?mine=true'); setItems(result.publications); setOwner(address || ''); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load drafts'); } }}>Sign in to load drafts and projects</Button>{error && <p role="alert">{error}</p>}{owner === address && items.map(p => <Link className="block text-red-400" key={p.id} href={`/create?id=${p.id}`}>{p.title} · {p.status}</Link>)}</section>;
}
