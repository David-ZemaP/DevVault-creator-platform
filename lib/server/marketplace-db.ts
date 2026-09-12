import { getSupabaseServerClient } from '../supabase/server';
import { dbRowToPublicationRecord } from '../supabase/types';
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
/** Commerce never falls back to volatile memory or an anonymous database key. */
export function commerceDb() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new HttpError(503, 'Configure private Supabase storage and apply the marketplace migration.');
  const db = getSupabaseServerClient();
  if (!db) throw new HttpError(503, 'Supabase is unavailable.');
  return db;
}
export function checked<T>(result: { data: T; error: { message: string; code?: string } | null }): T {
  if (result.error) {
    if (result.error.code === 'PGRST205' || result.error.message?.includes('schema cache')) {
      throw new HttpError(503, 'Database table missing. Please apply supabase/migrations/20260912_marketplace.sql.');
    }
    throw new HttpError(503, 'Persistence operation failed. Check server database configuration.');
  }
  return result.data;
}
export async function loadProject(id: string) {
  const row = checked(await commerceDb().from('publications').select('*').eq('id', id).maybeSingle());
  if (!row) throw new HttpError(404, 'Project not found');
  return dbRowToPublicationRecord(row);
}
export async function entitlement(id: string, wallet: string) {
  return checked(await commerceDb().from('purchases').select('*').eq('project_id', id).eq('buyer_wallet', wallet).eq('status', 'CONFIRMED').maybeSingle());
}
export function apiError(error: unknown) {
  return Response.json({ error: error instanceof HttpError ? error.message : 'Request failed. Please retry.' }, { status: error instanceof HttpError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } });
}
export function privateJson(data: unknown) {
  return Response.json(data, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' } });
}
