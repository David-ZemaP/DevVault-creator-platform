import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { commerceDb, checked, HttpError } from './marketplace-db';
export const sessionCookie = 'dv_session';
export const nonceCookie = 'dv_challenge';
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('hex');
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' };
export function sameOrigin(request: Request) {
  const expected = process.env.APP_ORIGIN || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined);
  if (!expected) throw new HttpError(503, 'APP_ORIGIN must be configured');
  if (request.headers.get('origin') !== new URL(expected).origin) throw new HttpError(403, 'Invalid request origin');
}
export async function authenticatedWallet() {
  const value = (await cookies()).get(sessionCookie)?.value;
  if (!value) throw new HttpError(401, 'Sign in with your wallet');
  const row = checked(await commerceDb().from('wallet_sessions').select('wallet').eq('token_hash', digest(value)).gt('expires_at', new Date().toISOString()).maybeSingle());
  if (!row) throw new HttpError(401, 'Wallet session expired');
  return row.wallet as string;
}
