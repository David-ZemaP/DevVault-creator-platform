import { getSupabaseServerClient } from '../supabase/server';
import { dbRowToPublicationRecord } from '../supabase/types';
export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
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
    const hint = process.env.NODE_ENV !== 'production'
      ? ` — ${result.error.message}${result.error.code ? ` (${result.error.code})` : ''}`
      : '';
    throw new HttpError(503, `Persistence operation failed. Check server database configuration.${hint}`);
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
export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new HttpError(400, 'Invalid JSON object', 'VALIDATION_ERROR');
  }
}

export function apiError(error: unknown) {
  const known = error instanceof HttpError;
  const status = known ? error.status : 500;
  const codes: Record<number, string> = { 400: 'VALIDATION_ERROR', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 503: 'SERVICE_UNAVAILABLE' };
  return Response.json({
    error: known ? error.message : 'Request failed. Please retry.',
    code: (known && error.code) || codes[status] || 'INTERNAL_ERROR',
  }, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}
export function privateJson(data: unknown) {
  return Response.json(data, { headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' } });
}
