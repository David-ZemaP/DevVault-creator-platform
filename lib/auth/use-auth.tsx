'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAccount, useConfig, useSignMessage } from 'wagmi';
import { getAccount } from 'wagmi/actions';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_HEARTBEAT_MS, AUTH_INACTIVITY_TIMEOUT_MS, sessionMatchesWallet, type AuthStatus, type WalletSession } from './constants';
import { authRequest, AuthRequestError, installAuthGuard } from './request';

interface AuthContextValue {
  walletAddress?: string;
  isWalletConnected: boolean;
  isSessionAuthenticated: boolean;
  authenticatedAddress?: string;
  status: AuthStatus;
  error: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<WalletSession | null>;
  idleTimeoutExpired: boolean;
  resetIdleTimeout: () => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const account = useAccount();
  const config = useConfig();
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();
  const [session, setSession] = useState<WalletSession | null>(null);
  const [phase, setPhase] = useState<AuthStatus>('CHECKING');
  const [error, setError] = useState('');
  const [idleTimeoutExpired, setIdleTimeoutExpired] = useState(false);
  const lastActivity = useRef<number>(Date.now());
  const current = useRef<WalletSession | null>(null);
  const generation = useRef(0);
  const previousWallet = useRef<string | undefined>(undefined);
  const revocationPending = useRef(false);
  const signing = useRef<Promise<void> | null>(null);
  const mutations = useRef<Promise<unknown>>(Promise.resolve());
  const checking = useRef<Promise<WalletSession | null> | null>(null);
  const wallet = useCallback(() => getAccount(config).address?.toLowerCase(), [config]);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivity.current > 5_000) {
      try {
        localStorage.setItem('devvault:last_activity', String(now));
      } catch {}
    }
    lastActivity.current = now;
  }, []);

  const resetIdleTimeout = useCallback(() => {
    setIdleTimeoutExpired(false);
    lastActivity.current = Date.now();
    try {
      localStorage.setItem('devvault:last_activity', String(Date.now()));
    } catch {}
  }, []);
  const clear = useCallback(() => {
    generation.current++;
    current.current = null;
    setSession(null);
    setPhase('REAUTH_REQUIRED');
    // Protected local component state is also scoped to authenticatedAddress below.
    queryClient.removeQueries({ predicate: query => query.meta?.protected === true });
  }, [queryClient]);
  const serialize = useCallback((operation: () => Promise<unknown>) => {
    const next = mutations.current.catch(() => {}).then(operation);
    mutations.current = next;
    return next;
  }, []);
  const logout = useCallback(async () => {
    clear();
    revocationPending.current = true;
    try {
      await serialize(() => authRequest('/auth/logout', {}));
      revocationPending.current = false;
      setError('');
    } catch (cause) {
      setError('Session revocation failed. Retry logout when the backend is available.');
      throw cause;
    }
  }, [clear, serialize]);
  const refreshSession = useCallback((): Promise<WalletSession | null> => {
    if (checking.current) return checking.current;
    const revision = generation.current;
    const address = wallet();
    checking.current = (async () => {
      try {
        if (revocationPending.current) {
          await logout();
          return null;
        }
        await mutations.current.catch(() => {});
        const next: WalletSession = await authRequest('/auth/session');
        if (revision !== generation.current || address !== wallet()) return null;
        if (!sessionMatchesWallet(next, address)) {
          await logout();
          return null;
        }
        const stable = current.current?.wallet === next.wallet && current.current?.expiresAt === next.expiresAt ? current.current : next;
        current.current = stable;
        setSession(stable);
        setPhase('AUTHENTICATED');
        setError('');
        return next;
      } catch (cause) {
        if (revision === generation.current) {
          clear();
          if (!(cause instanceof AuthRequestError && cause.status === 401)) setError('Unable to validate session. Retry when the backend is available.');
        }
        return null;
      } finally { checking.current = null; }
    })();
    return checking.current;
  }, [clear, logout, wallet]);

  const login = useCallback((): Promise<void> => {
    if (signing.current) return signing.current;
    signing.current = (async () => {
      const address = wallet();
      if (!address) throw new Error('Connect your wallet first');
      if (await refreshSession()) return;
      const revision = generation.current;
      const assertWallet = () => {
        if (revision !== generation.current || wallet() !== address) throw new AuthRequestError('Wallet changed. Re-authenticate wallet', 'WALLET_CHANGED');
      };
      setPhase('AUTHENTICATING');
      setError('');
      try {
        await serialize(async () => {
          assertWallet();
          const { message } = await authRequest('/auth/nonce', { wallet: address, chainId: getAccount(config).chainId });
          assertWallet();
          const signature = await signMessageAsync({ message });
          assertWallet();
          const next: WalletSession = await authRequest('/auth/verify', { signature });
          if (revision !== generation.current || wallet() !== address) {
            await authRequest('/auth/logout', {});
            assertWallet();
          }
          if (!sessionMatchesWallet(next, address)) throw new AuthRequestError('Wallet changed. Re-authenticate wallet', 'WALLET_CHANGED');
          current.current = next;
          setSession(next);
          setPhase('AUTHENTICATED');
        });
      } catch (cause) {
        clear();
        setError(cause instanceof Error ? cause.message : 'Authentication failed');
        throw cause;
      }
    })().finally(() => { signing.current = null; });
    return signing.current;
  }, [clear, config, refreshSession, serialize, signMessageAsync, wallet]);

  useEffect(() => installAuthGuard({ session: () => current.current, wallet, invalidate: clear }), [clear, wallet]);
  useEffect(() => {
    if (account.status === 'reconnecting' || account.status === 'connecting') return;
    const address = account.address?.toLowerCase();
    const changed = previousWallet.current !== undefined && previousWallet.current !== address;
    previousWallet.current = address;
    if (changed || (current.current && !sessionMatchesWallet(current.current, account.address))) {
      void logout().catch(() => {});
    } else {
      void refreshSession();
    }
  }, [account.address, account.status, logout, refreshSession]);
  useEffect(() => {
    const focus = () => { if (document.visibilityState === 'visible') void refreshSession(); };
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
    const timer = setInterval(() => { if (current.current && document.visibilityState === 'visible') void refreshSession(); }, AUTH_HEARTBEAT_MS);
    return () => { clearInterval(timer); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); };
  }, [refreshSession]);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(clear, Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [clear, session]);

  useEffect(() => {
    if (!session) return;
    lastActivity.current = Date.now();
    try {
      localStorage.setItem('devvault:last_activity', String(Date.now()));
    } catch {}

    const onActivity = () => recordActivity();
    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('click', onActivity, { passive: true });
    window.addEventListener('scroll', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });

    const idleTimer = setInterval(() => {
      let latest = lastActivity.current;
      try {
        const stored = localStorage.getItem('devvault:last_activity');
        if (stored) {
          const parsed = Number(stored);
          if (Number.isFinite(parsed) && parsed > latest) latest = parsed;
        }
      } catch {}

      if (Date.now() - latest >= AUTH_INACTIVITY_TIMEOUT_MS) {
        setIdleTimeoutExpired(true);
        void logout().catch(() => {});
      }
    }, 10_000);

    return () => {
      clearInterval(idleTimer);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('touchstart', onActivity);
    };
  }, [session, recordActivity, logout]);

  const authenticated = sessionMatchesWallet(session, account.address);
  const status = !account.isConnected ? 'DISCONNECTED' : authenticated ? 'AUTHENTICATED' : phase === 'AUTHENTICATING' || phase === 'CHECKING' ? phase : 'REAUTH_REQUIRED';
  return <AuthContext.Provider value={{ walletAddress: account.address, isWalletConnected: account.isConnected, isSessionAuthenticated: authenticated,
    authenticatedAddress: authenticated ? session!.wallet : undefined, status, error, login, logout, refreshSession,
    idleTimeoutExpired, resetIdleTimeout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requires AuthProvider');
  return value;
}
