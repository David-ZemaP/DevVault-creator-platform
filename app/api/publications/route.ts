import { NextRequest } from 'next/server';
import { isAddress, keccak256, stringToBytes } from 'viem';
import { serverDb, generatePublicationId } from '@/lib/supabase/server';
import { publicPublication, isPublic, safeUrl } from '@/lib/marketplace/public';
import { authenticatedWallet, sameOrigin } from '@/lib/server/wallet-session';
import { commerceDb, checked, HttpError, apiError, privateJson } from '@/lib/server/marketplace-db';
import { dbRowToPublicationRecord } from '@/lib/supabase/types';
export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get('mine') === 'true') {
      const wallet = await authenticatedWallet();
      const rows = checked(await commerceDb().from('publications').select('*').eq('creator_wallet', wallet).order('created_at', { ascending: false }));
      return privateJson({ publications: (rows || []).map(dbRowToPublicationRecord).map(publicPublication) });
    }
    const items = await serverDb.publications.list(request.nextUrl.searchParams.get('creatorWallet') || undefined);
    return Response.json({ publications: items.filter(isPublic).map(publicPublication) });
  } catch (e) { return apiError(e); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const wallet = await authenticatedWallet();
    const body = await request.json();
    if (typeof body.title !== 'string' || !body.title.trim() || typeof body.description !== 'string' || !body.description.trim()) throw new HttpError(400, 'Title and description required');
    if (body.title.length > 180 || body.description.length > 50000) throw new HttpError(400, 'Project metadata is too long');
    for (const key of ['demoUrl', 'demoVideoUrl', 'coverImage']) if (body[key] && !safeUrl(body[key])) throw new HttpError(400, `Invalid ${key}: use HTTP or HTTPS`);
    if (body.zipUrl || body.repositoryUrl || body.demoPreviewCode) throw new HttpError(400, 'Use private ZIP upload and public demo URLs');
    if (body.lockAddress && !isAddress(body.lockAddress)) throw new HttpError(400, 'Invalid lock address');
    if (body.projectType === 'software' && (!/^[0-9]{1,60}$/.test(body.priceWei) || BigInt(body.priceWei) <= 0n)) throw new HttpError(400, 'Positive HSK price required');
    const db = commerceDb();
    checked(await db.from('users').upsert({ wallet }, { onConflict: 'wallet', ignoreDuplicates: true }));
    const row = checked(await db.from('publications').insert({
      id: generatePublicationId(), creator_wallet: wallet, title: body.title.trim(), description: body.description.trim(),
      preview: typeof body.preview === 'string' ? body.preview.slice(0, 1000) : body.description.slice(0, 180),
      premium_content: body.projectType === 'software' ? null : body.premiumContent,
      content_hash: keccak256(stringToBytes(body.description)), project_type: body.projectType === 'software' ? 'software' : 'article',
      demo_url: safeUrl(body.demoUrl), demo_video_url: safeUrl(body.demoVideoUrl), cover_image: safeUrl(body.coverImage),
      lock_address: body.lockAddress?.toLowerCase(), price_wei: body.priceWei, status: 'DRAFT',
    }).select().single());
    return privateJson({ publication: publicPublication(dbRowToPublicationRecord(row)) });
  } catch (e) { return apiError(e); }
}
