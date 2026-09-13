import { HSK_CHAIN_ID } from '../web3/hsk';

export const AUTH_SESSION_TTL_SECONDS = 2 * 60 * 60;
export const AUTH_CHALLENGE_TTL_SECONDS = 5 * 60;
export const AUTH_HEARTBEAT_MS = 5 * 60 * 1000;
export const AUTH_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
export const AUTH_CHAIN_IDS: readonly number[] = [HSK_CHAIN_ID, 43113];
export type AuthErrorCode = 'UNAUTHENTICATED' | 'SESSION_EXPIRED' | 'WALLET_CHANGED' | 'REAUTH_REQUIRED' | 'INVALID_SIGNATURE' | 'INVALID_NONCE';
export type AuthStatus = 'DISCONNECTED' | 'CHECKING' | 'AUTHENTICATING' | 'AUTHENTICATED' | 'REAUTH_REQUIRED';
export interface WalletSession { wallet: string; createdAt: string; expiresAt: string }

export function sessionMatchesWallet(session: WalletSession | null, wallet?: string, now = Date.now()) {
  return Boolean(wallet && session && session.wallet === wallet.toLowerCase() && Date.parse(session.expiresAt) > now);
}
