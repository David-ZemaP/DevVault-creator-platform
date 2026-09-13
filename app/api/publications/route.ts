import { NextRequest } from 'next/server';
import { createProject } from '@/lib/server/project-service';
import { serverDb } from '@/lib/supabase/server';
import { publicPublication, isPublic } from '@/lib/marketplace/public';
import { authenticatedWallet, sameOrigin } from '@/lib/server/wallet-session';
import { commerceDb, checked, jsonBody, apiError, privateJson } from '@/lib/server/marketplace-db';
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
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const wallet = await authenticatedWallet();
    const publication = await createProject(wallet, await jsonBody(request));
    return privateJson({ publication });
  } catch (error) {
    return apiError(error);
  }
}
