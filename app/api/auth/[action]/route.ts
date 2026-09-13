import { cookies } from 'next/headers';
import { isAddress } from 'viem';
import { AUTH_CHAIN_IDS, AUTH_CHALLENGE_TTL_SECONDS, AUTH_SESSION_TTL_SECONDS } from '@/lib/auth/constants';
import { authenticatedSession, revokeSession, sameOrigin, token, digest, cookieOptions, nonceCookie, sessionCookie } from '@/lib/server/wallet-session';
import { createWalletChallenge, verifyWalletChallenge } from '@/lib/server/siwe';
import { commerceDb, checked, HttpError, apiError, privateJson, jsonBody } from '@/lib/server/marketplace-db';

type Props = { params: Promise<{ action: string }> };

export async function GET(_request: Request, props: Props) {
  try {
    if ((await props.params).action !== 'session') throw new HttpError(404, 'Unknown action');
    return privateJson(await authenticatedSession());
  } catch (error) {
    return apiError(error);
  }
}

async function issueChallenge(body: Record<string, unknown>) {
  if (typeof body.wallet !== 'string' || !isAddress(body.wallet)) throw new HttpError(400, 'Invalid wallet');
  const chainId = body.chainId === undefined ? AUTH_CHAIN_IDS[0] : Number(body.chainId);
  const challenge = token();
  const wallet = body.wallet.toLowerCase();
  const row = createWalletChallenge(wallet, chainId, challenge, process.env.APP_ORIGIN!);
  const jar = await cookies();
  const previous = jar.get(nonceCookie)?.value;
  if (previous) checked(await commerceDb().from('wallet_challenges').delete().eq('token_hash', digest(previous)));
  checked(await commerceDb().from('wallet_challenges').insert({ token_hash: digest(challenge), wallet, ...row }));
  jar.set(nonceCookie, challenge, { ...cookieOptions, maxAge: AUTH_CHALLENGE_TTL_SECONDS });
  return privateJson({ message: row.message });
}

async function verifyChallenge(body: Record<string, unknown>) {
  const jar = await cookies();
  const challenge = jar.get(nonceCookie)?.value;
  if (!challenge) throw new HttpError(401, 'Request a new sign-in challenge', 'INVALID_NONCE');
  // DELETE RETURNING consumes a nonce once across workers, including failed signature attempts.
  const row = checked(await commerceDb().from('wallet_challenges').delete()
    .eq('token_hash', digest(challenge)).gt('expires_at', new Date().toISOString()).select().maybeSingle());
  jar.set(nonceCookie, '', { ...cookieOptions, maxAge: 0 });
  if (!row) throw new HttpError(401, 'Invalid or expired nonce', 'INVALID_NONCE');
  const wallet = await verifyWalletChallenge(row, challenge, body.signature, process.env.APP_ORIGIN!);
  await revokeSession();
  const session = token();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.parse(createdAt) + AUTH_SESSION_TTL_SECONDS * 1000).toISOString();
  const db = commerceDb();
  // Try insert with created_at (requires 20260912_auth_sessions migration); fall back without.
  let insertResult = await db.from('wallet_sessions').insert({ token_hash: digest(session), wallet, created_at: createdAt, expires_at: expiresAt });
  if (insertResult.error?.code === 'PGRST204' && insertResult.error.message.includes('created_at')) {
    insertResult = await db.from('wallet_sessions').insert({ token_hash: digest(session), wallet, expires_at: expiresAt });
  }
  checked(insertResult);
  jar.set(sessionCookie, session, { ...cookieOptions, maxAge: AUTH_SESSION_TTL_SECONDS, expires: new Date(expiresAt) });
  return privateJson({ wallet, createdAt, expiresAt });
}

export async function POST(request: Request, props: Props) {
  try {
    sameOrigin(request);
    const { action } = await props.params;
    if (action === 'logout') {
      await revokeSession();
      const jar = await cookies();
      const challenge = jar.get(nonceCookie)?.value;
      if (challenge) checked(await commerceDb().from('wallet_challenges').delete().eq('token_hash', digest(challenge)));
      jar.set(nonceCookie, '', { ...cookieOptions, maxAge: 0 });
      return privateJson({ ok: true });
    }
    if (action !== 'nonce' && action !== 'verify') throw new HttpError(404, 'Unknown action');
    const body = await jsonBody(request);
    return action === 'nonce' ? await issueChallenge(body) : await verifyChallenge(body);
  } catch (error) {
    return apiError(error);
  }
}
