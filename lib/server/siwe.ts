import { getAddress, verifyMessage, type Hex } from 'viem';
import { createSiweMessage, parseSiweMessage, validateSiweMessage } from 'viem/siwe';
import { AUTH_CHAIN_IDS, AUTH_CHALLENGE_TTL_SECONDS } from '../auth/constants';
import { HttpError } from './marketplace-db';

export function createWalletChallenge(wallet: string, chainId: number, nonce: string, origin: string, now = new Date()) {
  if (!AUTH_CHAIN_IDS.includes(chainId)) throw new HttpError(400, 'Connect to HashKey Testnet or Avalanche Fuji');
  const expirationTime = new Date(now.getTime() + AUTH_CHALLENGE_TTL_SECONDS * 1000);
  const url = new URL(origin);
  const message = createSiweMessage({
    address: getAddress(wallet), chainId, domain: url.host, scheme: url.protocol.slice(0, -1),
    uri: url.origin, version: '1', nonce, issuedAt: now, expirationTime,
    statement: 'Sign in to DevVault. This does not authorize a payment.',
  });
  return { message, expires_at: expirationTime.toISOString() };
}

/** Only the server-issued, atomically consumed message is eligible for verification. EOA signatures only. */
export async function verifyWalletChallenge(row: { wallet: string; message: string }, nonce: string, signature: unknown, origin: string, now = new Date()) {
  const message = parseSiweMessage(row.message);
  const url = new URL(origin);
  const issued = message.issuedAt?.getTime();
  const expires = message.expirationTime?.getTime();
  if (!validateSiweMessage({ message, address: getAddress(row.wallet), domain: url.host, scheme: url.protocol.slice(0, -1), nonce, time: now }) ||
      message.uri !== url.origin || message.version !== '1' || !AUTH_CHAIN_IDS.includes(message.chainId ?? 0) ||
      !issued || !expires || issued > now.getTime() || expires <= now.getTime() ||
      expires - issued > AUTH_CHALLENGE_TTL_SECONDS * 1000) {
    throw new HttpError(401, 'Invalid or expired sign-in challenge', 'INVALID_NONCE');
  }
  let valid = false;
  if (typeof signature === 'string' && /^0x[0-9a-fA-F]+$/.test(signature)) {
    valid = await verifyMessage({ address: getAddress(row.wallet), message: row.message, signature: signature as Hex }).catch(() => false);
  }
  if (!valid) throw new HttpError(401, 'Invalid wallet signature', 'INVALID_SIGNATURE');
  return message.address!.toLowerCase();
}
