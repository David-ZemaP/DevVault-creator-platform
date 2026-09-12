import { serverDb } from '@/lib/supabase/server';
import { publicPublication, isPublic } from '@/lib/marketplace/public';
import { apiError, HttpError } from '@/lib/server/marketplace-db';
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const publication = await serverDb.publications.getById(id);
    if (!publication || !isPublic(publication)) throw new HttpError(404, 'Publication not found');
    const safe = publicPublication(publication);
    return Response.json({ publication: safe, ...safe });
  } catch (e) { return apiError(e); }
}
