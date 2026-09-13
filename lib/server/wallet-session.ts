import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { AUTH_SESSION_TTL_SECONDS, type WalletSession } from '../auth/constants';
import { commerceDb, checked, HttpError } from './marketplace-db';

export const sessionCookie = 'dv_session';
export const nonceCookie = 'dv_challenge';
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('hex');
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' };

export function sameOrigin(request: Request) {
  const expected = process.env.APP_ORIGIN || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined);
  if (!expected) throw new HttpError(503, 'APP_ORIGIN must be configured');
  const origin = request.headers.get('origin');
  if (process.env.NODE_ENV !== 'production' && origin) {
    try {
      const originHost = new URL(origin).hostname;
      if (originHost === 'localhost' || originHost === '127.0.0.1') return;
    } catch {}
  }
  if (origin !== new URL(expected).origin) throw new HttpError(403, 'Invalid request origin');
}

export async function authenticatedSession(): Promise<WalletSession> {
  const value = (await cookies()).get(sessionCookie)?.value;
  if (!value) throw new HttpError(401, 'Re-authenticate wallet', 'UNAUTHENTICATED');
  // Try to select created_at; the column is added by 20260912_auth_sessions migration.
  // If absent (PGRST204), fall back to expires_at-only validation until migration is applied.
  let row: { wallet: string; created_at?: string; expires_at: string } | null = null;
  const db = commerceDb();
  const fullResult = await db.from('wallet_sessions').select('wallet, created_at, expires_at').eq('token_hash', digest(value)).maybeSingle();
  // 42703 = PostgreSQL "column does not exist" (SELECT); PGRST204 = PostgREST schema cache miss (INSERT)
  if ((fullResult.error?.code === '42703' || fullResult.error?.code === 'PGRST204') && fullResult.error.message.includes('created_at')) {
    const slim = checked(await db.from('wallet_sessions').select('wallet, expires_at').eq('token_hash', digest(value)).maybeSingle());
    if (slim) row = { wallet: slim.wallet, expires_at: slim.expires_at };
  } else {
    row = checked(fullResult);
  }
  if (!row) throw new HttpError(401, 'Session revoked. Re-authenticate wallet', 'REAUTH_REQUIRED');
  const expires = Date.parse(row.expires_at);
  if (!Number.isFinite(expires) || expires <= Date.now()) {
    throw new HttpError(401, 'Session expired. Re-authenticate wallet', 'SESSION_EXPIRED');
  }
  // When created_at is present, apply full epoch validation.
  if (row.created_at) {
    const created = Date.parse(row.created_at);
    if (!Number.isFinite(created) || created > Date.now() || expires - created > AUTH_SESSION_TTL_SECONDS * 1000) {
      throw new HttpError(401, 'Session expired. Re-authenticate wallet', 'SESSION_EXPIRED');
    }
  }
  const expectedWallet = (await headers()).get('x-devvault-wallet');
  if (expectedWallet && expectedWallet.toLowerCase() !== row.wallet) {
    throw new HttpError(401, 'Wallet changed. Re-authenticate wallet', 'WALLET_CHANGED');
  }
  const now = row.created_at ?? new Date().toISOString();
  return { wallet: row.wallet, createdAt: now, expiresAt: row.expires_at };
}

export async function authenticatedWallet() {
  return (await authenticatedSession()).wallet;
}

export async function revokeSession() {
  const jar = await cookies();
  const value = jar.get(sessionCookie)?.value;
  if (value) checked(await commerceDb().from('wallet_sessions').delete().eq('token_hash', digest(value)));
  jar.set(sessionCookie, '', { ...cookieOptions, maxAge: 0 });
}
