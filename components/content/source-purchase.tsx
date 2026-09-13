'use client';
import { useAuth } from '@/lib/auth/use-auth';
import { getAccount } from 'wagmi/actions';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useConfig, useSwitchChain, useWalletClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { createPublicClient, http, formatEther } from 'viem';
import { Interface, ZeroAddress } from 'ethers';
import { PUBLIC_LOCK_ABI, PURCHASE_SIGNATURE } from '@/lib/web3/abis';
import { HSK_CHAIN_ID, HSK_RPC_URL } from '@/lib/web3/hsk';
import { hashkeyTestnet } from '@/lib/web3/chains';
import { getHskExplorerTxUrl } from '@/lib/web3/hashkey';
import { marketplaceRequest, useWalletSession } from '@/lib/marketplace/client';
import { purchaseState } from '@/lib/marketplace/public';
import { Button } from '@/components/ui/button';

interface AccessState {
  creator: boolean;
  purchased: boolean;
  isSubscription?: boolean;
  hasActiveMembership?: boolean;
  transactionHash?: string;
}

export type PurchasePhase =
  | 'idle'
  | 'connecting'
  | 'awaiting_signature'
  | 'submitted'
  | 'confirming'
  | 'verifying'
  | 'confirmed'
  | 'failed';

interface PurchaseProps { id: string; priceWei?: string; acquisitionModel?: 'lifetime' | 'subscription' }

function useProjectPurchase({ id, priceWei, acquisitionModel = 'lifetime' }: PurchaseProps) {
  const { address, isConnected, chainId } = useAccount();
  const { data: wallet } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const authenticate = useWalletSession();
  const auth = useAuth();
  const config = useConfig();
  const [access, setAccess] = useState<AccessState>({
    creator: false,
    purchased: false,
    isSubscription: acquisitionModel === 'subscription',
    hasActiveMembership: false,
  });
  const [phase, setPhase] = useState<PurchasePhase>('idle');
  const [message, setMessage] = useState('');
  const [tx, setTx] = useState('');
  const pending = !['idle', 'confirmed', 'failed'].includes(phase);
  const storageKey = `devvault:payment:${id}:${address?.toLowerCase()}`;

  useEffect(() => {
    let active = true;
    setAccess({ creator: false, purchased: false, isSubscription: acquisitionModel === 'subscription', hasActiveMembership: false });
    setTx(''); setMessage('');
    if (address) {
      setTx(localStorage.getItem(storageKey) || '');
      if (auth.isSessionAuthenticated) {
        marketplaceRequest(`/publications/${id}/access`).then(data => {
          if (active) { setAccess(data); if (data.transactionHash) setTx(data.transactionHash); }
        }).catch(() => {});
      }
    }
    return () => { active = false; };
  }, [address, id, storageKey, acquisitionModel, auth.isSessionAuthenticated, auth.authenticatedAddress]);

  const isSubscription = acquisitionModel === 'subscription' || Boolean(access.isSubscription);
  const priceEth = priceWei ? formatEther(BigInt(priceWei)) : '—';
  const visibleAccess = auth.isSessionAuthenticated ? access : { creator: false, purchased: false, hasActiveMembership: false };
  const state = purchaseState(isConnected, visibleAccess.creator, visibleAccess.purchased, pending);
  const canDownload = visibleAccess.creator || (isSubscription ? Boolean(visibleAccess.hasActiveMembership) : visibleAccess.purchased);

  const buttonText = (): string => {
    if (phase === 'connecting') return 'Connecting...';
    if (phase === 'awaiting_signature') return 'Confirm in wallet...';
    if (phase === 'submitted') return 'Transaction submitted...';
    if (phase === 'confirming') return 'Waiting for confirmation...';
    if (phase === 'verifying') return 'Verifying purchase...';
    if (!isConnected) return 'Connect wallet';
    if (!auth.isSessionAuthenticated) return 'Re-authenticate wallet';
    if (chainId !== HSK_CHAIN_ID) return 'Switch to HashKey Chain Testnet';
    if (access.creator) return 'Access source code';
    if (isSubscription) {
      if (access.hasActiveMembership) return 'Access source code';
      if (access.purchased && !access.hasActiveMembership) return `Subscription Expired · Renew — ${priceEth} HSK`;
      if (tx) return 'Resume payment verification';
      return `Subscribe — ${priceEth} HSK`;
    }
    if (access.purchased) return 'Access source code';
    if (tx) return 'Resume payment verification';
    return `Buy Source Code — ${priceEth} HSK`;
  };

  async function run(download = false) {
    if (!isConnected) { openConnectModal?.(); return; }
    setPhase('connecting'); setMessage('');
    const assertWallet = () => {
      if (!address || getAccount(config).address?.toLowerCase() !== address.toLowerCase()) throw new Error('Wallet changed. Re-authenticate wallet');
    };
    try {
      await authenticate();
      assertWallet();
      // Switch to HSK before checkout so the wallet is ready for the transaction.
      if (chainId !== HSK_CHAIN_ID) await switchChainAsync({ chainId: HSK_CHAIN_ID });
      const current = await marketplaceRequest(`/publications/${id}/access`);
      setAccess(current);
      const activeSubscription = current.isSubscription || isSubscription;
      const hasValidAccess = current.creator || (activeSubscription ? current.hasActiveMembership : current.purchased);
      if (hasValidAccess) {
        if (download) {
          const source = await marketplaceRequest(`/publications/${id}/source`);
          assertWallet();
          window.location.assign(source.url);
          return;
        }
        setPhase('idle');
        return;
      }
      let hash = localStorage.getItem(storageKey);
      if (!hash) {
        const checkout = await marketplaceRequest(`/publications/${id}/checkout`, {});
        if (!activeSubscription && (checkout.purchased || checkout.creator)) { setAccess(checkout); setPhase('idle'); return; }
        if (activeSubscription && checkout.creator) { setAccess(checkout); setPhase('idle'); return; }
        const confirmMsg = activeSubscription
          ? `Subscribe to "${checkout.title}" for ${formatEther(BigInt(checkout.priceWei))} HSK on HSKChain Testnet?\n\n30-day recurring access via Unlock Protocol. Gas is additional.`
          : `Buy source code for "${checkout.title}" for ${formatEther(BigInt(checkout.priceWei))} HSK on HSKChain Testnet?\n\nPermanent access. Gas is additional.`;
        if (!window.confirm(confirmMsg)) { setPhase('idle'); return; }
        assertWallet();
        setPhase('awaiting_signature');
        if (!wallet || !address) throw new Error('Wallet unavailable');
        const data = new Interface(PUBLIC_LOCK_ABI).encodeFunctionData(PURCHASE_SIGNATURE, [[{
          value: 0n, recipient: address, referrer: ZeroAddress, protocolReferrer: ZeroAddress,
          keyManager: ZeroAddress, data: checkout.data, additionalPeriods: 0n,
        }]]) as `0x${string}`;
        hash = await wallet.sendTransaction({ account: address, chain: hashkeyTestnet, to: checkout.lockAddress, value: BigInt(checkout.priceWei), data });
        localStorage.setItem(storageKey, hash);
        assertWallet();
        setPhase('submitted'); setTx(hash);
      }
      setPhase('confirming');
      setMessage('Waiting for confirmation...');
      const rpc = createPublicClient({ chain: hashkeyTestnet, transport: http(HSK_RPC_URL) });
      const receipt = await rpc.waitForTransactionReceipt({ hash: hash as `0x${string}`, confirmations: 2 });
      if (receipt.status !== 'success') {
        localStorage.removeItem(storageKey); setTx(''); throw new Error('Transaction failed. No source access granted. You can retry.');
      }
      assertWallet();
      hash = receipt.transactionHash;
      setTx(hash); localStorage.setItem(storageKey, hash);
      setPhase('verifying');
      setMessage('Backend is verifying payment...');
      await marketplaceRequest(`/publications/${id}/verify`, { transactionHash: hash });
      const freshAccess = await marketplaceRequest(`/publications/${id}/access`);
      assertWallet();
      setPhase('confirmed');
      setAccess(freshAccess); localStorage.removeItem(storageKey);
      setMessage(activeSubscription ? 'Subscribed ✓ — 30-day source access active' : 'Purchased ✓ — permanent source access');
    } catch (error) {
      setPhase('failed');
      setMessage(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setPhase(previous => ['confirmed', 'failed'].includes(previous) ? previous : 'idle');
    }
  }
  return { id, priceEth, isSubscription, state, canDownload, pending, phase, message, tx, access: visibleAccess, buttonLabel: buttonText(), run };
}

export function SourcePurchase(props: PurchaseProps) {
  return <ProjectPurchaseView {...useProjectPurchase(props)} />;
}

export function ProjectPurchaseView({ id, priceEth, isSubscription, state, canDownload, pending, phase, message, tx, access, buttonLabel, run }: ReturnType<typeof useProjectPurchase>) {
  return (
    <section
      className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-4"
      aria-label="Source code"
      data-purchase-state={phase}
    >
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <h2 className="text-base font-semibold text-white">Source code</h2>
        <span className="inline-flex items-center rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-mono text-zinc-400">
          HSKChain (133)
        </span>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        {isSubscription
          ? '30-day subscription · Access to code & updates while subscribed'
          : 'Private archive · permanent access after verified purchase'}
      </p>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
        <span className="text-[11px] text-zinc-500 block">Required Payment</span>
        <p className="text-xl font-bold text-white mt-0.5">
          {priceEth} <span className="text-xs font-normal text-zinc-400">HSK</span>
        </p>
        <p className="text-[10px] text-zinc-500 mt-0.5">{priceEth} HSK · HSKChain Testnet (133)</p>
      </div>

      {state === 'creator' ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs text-zinc-300">
          Your project · <Link href={`/create?id=${id}`} className="font-medium text-white hover:underline">Manage project</Link>
        </div>
      ) : isSubscription ? (
        access.hasActiveMembership ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-400">
            Subscribed · Active ✓
          </div>
        ) : access.purchased ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs font-medium text-amber-400">
            Subscription Expired
          </div>
        ) : null
      ) : state === 'purchased' ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-400">
          Purchased ✓
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button disabled={pending} onClick={() => run(canDownload)} className="w-full sm:w-auto">
          {buttonLabel}
        </Button>
        {isSubscription && access.hasActiveMembership && !access.creator && (
          <Button variant="outline" disabled={pending} onClick={() => run(false)} className="w-full sm:w-auto">
            Extend / Renew Subscription
          </Button>
        )}
      </div>

      {message && (
        <div role="status" className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs text-zinc-300">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-1.5 border-t border-zinc-800/80 pt-3 text-xs">
        {tx && (
          <a href={getHskExplorerTxUrl(tx)} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-200 font-medium transition-colors">
            View transaction ↗
          </a>
        )}
        {state === 'purchased' && (
          <Link href="/purchases" className="text-zinc-200 hover:text-white font-medium transition-colors">
            My Purchases →
          </Link>
        )}
      </div>
    </section>
  );
}
