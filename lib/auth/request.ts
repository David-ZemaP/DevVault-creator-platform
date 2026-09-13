import type { WalletSession } from './constants';
import { sessionMatchesWallet } from './constants';

export class AuthRequestError extends Error {
  constructor(message: string, public code: string, public status = 401) { super(message); }
}

type Guard = { session: () => WalletSession | null; wallet: () => string | undefined; invalidate: () => void };
let guard: Guard | undefined;
export function installAuthGuard(value: Guard) {
  guard = value;
  return () => { if (guard === value) guard = undefined; };
}

export async function authRequest(path: string, body?: unknown) {
  return request(path, body, false);
}

export async function marketplaceRequest(path: string, body?: unknown) {
  return request(path, body, true);
}

async function request(path: string, body: unknown, protectedRequest: boolean) {
  const current = guard;
  const identity = current?.session();
  const assertIdentity = () => {
    if (!current || !sessionMatchesWallet(identity ?? null, current.wallet()) || identity !== current.session()) {
      throw new AuthRequestError('Re-authenticate wallet', 'REAUTH_REQUIRED');
    }
  };
  if (protectedRequest) assertIdentity();
  const headers = new Headers();
  if (protectedRequest) headers.set('X-DevVault-Wallet', identity!.wallet);
  if (body !== undefined && !(body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST', cache: 'no-store', credentials: 'same-origin', headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    if (protectedRequest && response.status === 401 && identity === current?.session()) current?.invalidate();
    throw new AuthRequestError(data.error || 'Request failed', data.code || 'REQUEST_FAILED', response.status);
  }
  // A response started by an old wallet must never repopulate protected UI after a change.
  if (protectedRequest) assertIdentity();
  return data;
}
