'use client';
import { useAccount, useSignMessage } from 'wagmi';
export async function marketplaceRequest(path: string, body?: unknown) {
  const response = await fetch(`/api${path}`, body === undefined ? { cache: 'no-store' } : {
    method: 'POST', headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export function useWalletSession() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  return async () => {
    if (!address) throw new Error('Connect your wallet first');
    const session = await fetch('/api/auth/session', { cache: 'no-store' });
    if (session.ok && (await session.json()).wallet === address.toLowerCase()) return;
    const { message } = await marketplaceRequest('/auth/nonce', { wallet: address });
    const signature = await signMessageAsync({ message });
    await marketplaceRequest('/auth/verify', { signature });
  };
}
