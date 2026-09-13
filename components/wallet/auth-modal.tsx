'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal, useChainModal } from '@rainbow-me/rainbowkit';
import { useAuth } from '@/lib/auth/use-auth';
import { formatAddress } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Wallet,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { getHskExplorerAddressUrl } from '@/lib/web3/hashkey';

interface AuthModalContextValue {
  isOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue>({
  isOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function useAuthModal() {
  return useContext(AuthModalContext);
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openAuthModal = useCallback(() => setIsOpen(true), []);
  const closeAuthModal = useCallback(() => setIsOpen(false), []);

  return (
    <AuthModalContext.Provider value={{ isOpen, openAuthModal, closeAuthModal }}>
      {children}
      <AuthModal isOpen={isOpen} onClose={closeAuthModal} />
    </AuthModalContext.Provider>
  );
}

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const auth = useAuth();
  const [copied, setCopied] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const copyAddress = () => {
    if (!address) return;
    void navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAuthenticate = async () => {
    try {
      await auth.login();
    } catch {}
  };

  const handleLockSession = async () => {
    try {
      await auth.logout();
    } catch {}
  };

  const handleFullDisconnect = async () => {
    try {
      await auth.logout();
    } catch {}
    disconnect();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-950">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-base font-semibold text-zinc-900 dark:text-white">
              DevVault Authentication
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Non-custodial, cryptographic access to private creator artifacts.
            </p>
          </div>
        </div>

        {/* Inactivity Security Badge */}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
          <Clock className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <span>
            <strong>30-Minute Inactivity Protection:</strong> Session locks automatically after 30 minutes of idle time.
          </span>
        </div>

        {/* Idle timeout alert if expired */}
        {auth.idleTimeoutExpired && !auth.isSessionAuthenticated && isConnected && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300"
          >
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Session Locked for Inactivity</p>
              <p className="text-[11px] mt-0.5">
                Your wallet remains connected, but your SIWE session locked after 30 minutes of inactivity. Sign below to unlock.
              </p>
            </div>
          </div>
        )}

        {/* Error notification */}
        {auth.error && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{auth.error}</p>
          </div>
        )}

        {/* Steps Flow */}
        <div className="mt-5 space-y-3">
          {/* STEP 1: Connect Wallet */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isConnected
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {isConnected ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {isConnected ? 'Wallet Connected' : 'Connect Your Web3 Wallet'}
                </span>
              </div>
              {isConnected && address && (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    {formatAddress(address)}
                  </span>
                  <button
                    type="button"
                    onClick={copyAddress}
                    title="Copy address"
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}
            </div>

            {!isConnected ? (
              <div className="mt-3 space-y-2.5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select your wallet to connect to HashKey Chain Testnet and Avalanche Fuji.
                </p>
                <Button
                  onClick={() => {
                    openConnectModal?.();
                  }}
                  className="w-full gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Select Wallet
                </Button>
              </div>
            ) : (
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={openChainModal}
                  className="inline-flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                >
                  <span>Network: {chain?.name ?? 'Unknown'}</span>
                  <span className="underline">Change</span>
                </button>
                <a
                  href={getHskExplorerAddressUrl(address!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  <span>Explorer</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            )}
          </div>

          {/* STEP 2: Authenticate with SIWE */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              !isConnected
                ? 'border-zinc-200/60 bg-zinc-50/20 opacity-60 dark:border-zinc-800/40 dark:bg-zinc-900/10'
                : auth.isSessionAuthenticated
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    auth.isSessionAuthenticated
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : isConnected
                      ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600'
                  }`}
                >
                  {auth.isSessionAuthenticated ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {auth.isSessionAuthenticated ? 'Session Authenticated' : 'Cryptographic Signature'}
                </span>
              </div>
              {auth.isSessionAuthenticated && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              )}
            </div>

            {isConnected && !auth.isSessionAuthenticated && (
              <div className="mt-3 space-y-2.5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sign a gasless, free message in your wallet to verify ownership. This authorizes access to purchases and creator studio for this session.
                </p>
                <Button
                  disabled={auth.status === 'AUTHENTICATING'}
                  onClick={handleAuthenticate}
                  className="w-full gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  {auth.status === 'AUTHENTICATING' ? 'Awaiting signature in wallet…' : 'Sign & Authenticate'}
                </Button>
              </div>
            )}

            {auth.isSessionAuthenticated && (
              <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Your identity is verified. If you are inactive for 30 minutes, your session will automatically lock.
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLockSession}
                    className="gap-1.5 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Lock Session
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFullDisconnect}
                    className="gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 border-t border-zinc-200 pt-3 text-center text-[10px] text-zinc-400 dark:border-zinc-800">
          <span>Supported: HashKey Chain (133) · Avalanche Fuji (43113) · Non-custodial</span>
        </div>
      </div>
    </div>
  );
}
