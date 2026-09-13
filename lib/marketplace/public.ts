import type { PublicationRecord } from '../supabase/types';

export function safeUrl(value?: string | null): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    const local = process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && url.hostname === 'localhost';
    if ((url.protocol !== 'https:' && !local) || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}
export function isPublic(p: PublicationRecord): boolean {
  return !p.isHidden && (p.status === 'PUBLISHED' || (!p.status && p.projectType !== 'software'));
}
/** Explicit allowlist shared by API and server-rendered pages. */
export function publicPublication(p: PublicationRecord): PublicationRecord {
  return {
    id: p.id, creatorWallet: p.creatorWallet, title: p.title, description: p.description,
    preview: p.preview, contentHash: p.contentHash, lockAddress: p.lockAddress,
    proofId: p.proofId, avalancheTx: p.avalancheTx, version: p.version,
    createdAt: p.createdAt, projectType: p.projectType, demoUrl: safeUrl(p.demoUrl),
    demoVideoUrl: safeUrl(p.demoVideoUrl), coverImage: safeUrl(p.coverImage),
    status: p.status, publishedAt: p.publishedAt, priceWei: p.priceWei,
    isHidden: p.isHidden, isGated: p.isGated,
    acquisitionModel: p.acquisitionModel || 'lifetime',
  };
}
export function purchaseState(connected: boolean, creator: boolean, purchased: boolean, pending: boolean) {
  return !connected ? 'connect' : creator ? 'creator' : purchased ? 'purchased' : pending ? 'pending' : 'buy';
}
