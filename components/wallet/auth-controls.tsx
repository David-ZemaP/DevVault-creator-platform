'use client';
import { useAuth } from '@/lib/auth/use-auth';

export function AuthControls() {
  const auth = useAuth();
  if (!auth.isWalletConnected) return null;
  return <div className="flex flex-wrap items-center gap-2 text-xs">
    {auth.isSessionAuthenticated ? <>
      <span className="text-emerald-400">Wallet authenticated</span>
      <button type="button" onClick={() => void auth.logout().catch(() => {})}>Logout</button>
    </> : <button type="button" disabled={auth.status === 'AUTHENTICATING'} onClick={() => void auth.login().catch(() => {})}>
      {auth.status === 'AUTHENTICATING' ? 'Awaiting wallet signature…' : 'Re-authenticate wallet'}
    </button>}
    {auth.error && <span role="alert">{auth.error}</span>}
  </div>;
}
