import { cookies } from 'next/headers';
import { isAddress, verifyMessage } from 'viem';
import { authenticatedWallet, sameOrigin, token, digest, cookieOptions, nonceCookie, sessionCookie } from '@/lib/server/wallet-session';
import { commerceDb, checked, HttpError, apiError, privateJson } from '@/lib/server/marketplace-db';
export async function GET() {
  try { return privateJson({ wallet: await authenticatedWallet() }); } catch (e) { return apiError(e); }
}
export async function POST(request: Request, props: { params: Promise<{ action: string }> }) {
  try {
    sameOrigin(request);
    const { action } = await props.params;
    const db = commerceDb(), jar = await cookies();
    if (action === 'logout') {
      const session = jar.get(sessionCookie)?.value;
      if (session) checked(await db.from('wallet_sessions').delete().eq('token_hash', digest(session)));
      jar.delete(sessionCookie);
      return privateJson({ ok: true });
    }
    const body = await request.json();
    if (action === 'nonce') {
      if (!isAddress(body.wallet)) throw new HttpError(400, 'Invalid wallet');
      const challenge = token(), wallet = body.wallet.toLowerCase();
      const expires = new Date(Date.now() + 5 * 60_000).toISOString();
      const origin = process.env.APP_ORIGIN || 'http://localhost:3000';
      const message = `${new URL(origin).host} requests a DevVault wallet sign-in.\nWallet: ${wallet}\nURI: ${origin}\nNonce: ${challenge}\nExpires: ${expires}\nThis signature authenticates your wallet; it does not authorize a payment.`;
      checked(await db.from('wallet_challenges').insert({ token_hash: digest(challenge), wallet, message, expires_at: expires }));
      jar.set(nonceCookie, challenge, { ...cookieOptions, maxAge: 300 });
      return privateJson({ message });
    }
    if (action !== 'verify') throw new HttpError(404, 'Unknown action');
    const challenge = jar.get(nonceCookie)?.value;
    if (!challenge) throw new HttpError(401, 'Request a new sign-in challenge');
    // Atomic consumption prevents replay across workers, even concurrent requests.
    const row = checked(await db.from('wallet_challenges').delete().eq('token_hash', digest(challenge)).gt('expires_at', new Date().toISOString()).select().maybeSingle());
    jar.delete(nonceCookie);
    if (!row || !await verifyMessage({ address: row.wallet, message: row.message, signature: body.signature })) throw new HttpError(401, 'Invalid or expired signature');
    const session = token();
    checked(await db.from('wallet_sessions').insert({ token_hash: digest(session), wallet: row.wallet, expires_at: new Date(Date.now() + 86400_000).toISOString() }));
    jar.set(sessionCookie, session, { ...cookieOptions, maxAge: 86400 });
    return privateJson({ wallet: row.wallet });
  } catch (e) { return apiError(e); }
}
