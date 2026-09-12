'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';
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

export function SourcePurchase({
  id,
  priceWei,
  acquisitionModel = 'lifetime',
}: {
  id: string;
  priceWei?: string;
  acquisitionModel?: 'lifetime' | 'subscription';
}) {
  const { address, isConnected } = useAccount();
  const { data: wallet } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const authenticate = useWalletSession();
  const [access, setAccess] = useState<AccessState>({
    creator: false,
    purchased: false,
    isSubscription: acquisitionModel === 'subscription',
    hasActiveMembership: false,
  });
  const [pending, setPending] = useState(false), [message, setMessage] = useState('');
  const [tx, setTx] = useState('');
  const storageKey = `devvault:payment:${id}:${address?.toLowerCase()}`;
  useEffect(() => {
    let active = true;
    // Clear authorization display immediately when the connected wallet changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccess({ creator: false, purchased: false, isSubscription: acquisitionModel === 'subscription', hasActiveMembership: false }); setTx(''); setMessage('');
    if (address) {
      setTx(localStorage.getItem(storageKey) || '');
      fetch('/api/auth/session', { cache: 'no-store' }).then(async r => {
        if (!r.ok || (await r.json()).wallet !== address.toLowerCase()) return;
        const data = await marketplaceRequest(`/publications/${id}/access`);
        if (active) { setAccess(data); if (data.transactionHash) setTx(data.transactionHash); }
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [address, id, storageKey, acquisitionModel]);
  const isSubscription = acquisitionModel === 'subscription' || Boolean(access.isSubscription);
  const priceEth = priceWei ? formatEther(BigInt(priceWei)) : '—';
  const state = purchaseState(isConnected, access.creator, access.purchased, pending);
  const canDownload = access.creator || (isSubscription ? Boolean(access.hasActiveMembership) : access.purchased);

  const buttonText = () => {
    if (pending) return 'Waiting for confirmation...';
    if (!isConnected) return 'Connect wallet to purchase';
    if (access.creator) return 'Access source code';
    if (isSubscription) {
      if (access.hasActiveMembership) return 'Access source code';
      if (tx) return 'Resume payment verification';
      if (access.purchased && !access.hasActiveMembership) return `Subscription Expired · Renew (${priceEth} HSK)`;
      return `Subscribe (${priceEth} HSK / 30 days)`;
    }
    if (access.purchased) return 'Access source code';
    if (tx) return 'Resume payment verification';
    return 'Buy source code';
  };

  async function run(download = false) {
    if (!isConnected) { openConnectModal?.(); return; }
    setPending(true); setMessage('');
    try {
      await authenticate();
      const current = await marketplaceRequest(`/publications/${id}/access`);
      setAccess(current);
      const activeSubscription = current.isSubscription || isSubscription;
      const hasValidAccess = current.creator || (activeSubscription ? current.hasActiveMembership : current.purchased);
      if (hasValidAccess) {
        if (download) {
          const source = await marketplaceRequest(`/publications/${id}/source`);
          window.location.assign(source.url);
          return;
        }
      }
      let hash = tx || localStorage.getItem(storageKey);
      if (!hash) {
        const checkout = await marketplaceRequest(`/publications/${id}/checkout`, {});
        if (!activeSubscription && (checkout.purchased || checkout.creator)) { setAccess(checkout); return; }
        if (activeSubscription && checkout.creator) { setAccess(checkout); return; }
        const confirmMsg = activeSubscription
          ? `Subscribe to “${checkout.title}” for ${formatEther(BigInt(checkout.priceWei))} HSK on HSKChain Testnet? 30-day recurring access via Unlock. Gas is additional.`
          : `Buy source code for “${checkout.title}” for ${formatEther(BigInt(checkout.priceWei))} HSK on HSKChain Testnet? Gas is additional. Access is permanent.`;
        if (!window.confirm(confirmMsg)) return;
        await switchChainAsync({ chainId: HSK_CHAIN_ID });
        if (!wallet || !address) throw new Error('Wallet unavailable');
        const data = new Interface(PUBLIC_LOCK_ABI).encodeFunctionData(PURCHASE_SIGNATURE, [[{
          value: 0n, recipient: address, referrer: ZeroAddress, protocolReferrer: ZeroAddress,
          keyManager: ZeroAddress, data: checkout.data, additionalPeriods: 0n,
        }]]) as `0x${string}`;
        hash = await wallet.sendTransaction({ account: address, chain: hashkeyTestnet, to: checkout.lockAddress, value: BigInt(checkout.priceWei), data });
        localStorage.setItem(storageKey, hash); setTx(hash);
      }
      setMessage('Waiting for confirmation...');
      const rpc = createPublicClient({ chain: hashkeyTestnet, transport: http(HSK_RPC_URL) });
      const receipt = await rpc.waitForTransactionReceipt({ hash: hash as `0x${string}`, confirmations: 2 });
      if (receipt.status !== 'success') {
        localStorage.removeItem(storageKey); setTx(''); throw new Error('Transaction failed. No source access granted. You can retry.');
      }
      hash = receipt.transactionHash;
      setTx(hash); localStorage.setItem(storageKey, hash);
      setMessage('Backend is verifying payment...');
      const result = await marketplaceRequest(`/publications/${id}/verify`, { transactionHash: hash });
      const freshAccess = await marketplaceRequest(`/publications/${id}/access`).catch(() => result);
      setAccess(freshAccess); localStorage.removeItem(storageKey);
      setMessage(activeSubscription ? 'Subscribed ✓ — active 30-day source access' : 'Purchased ✓ — permanent source access');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Purchase failed'); }
    finally { setPending(false); }
  }
  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-4" aria-label="Source code">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <h2 className="text-base font-semibold text-white">Source code</h2>
        <span className="inline-flex items-center rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-mono text-zinc-400">
          HSKChain (133)
        </span>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        {isSubscription
          ? 'Monthly subscription (30 days) · Access to code & updates while subscribed'
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
          Your project · <Link href={`/create?id=${id}`} className="font-medium text-blue-400 hover:underline">Manage project</Link>
        </div>
      ) : isSubscription ? (
        access.hasActiveMembership ? (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-400">
            Subscribed · Active (30 days) ✓
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

      <div className="flex flex-col gap-2 pt-1">
        <Button disabled={pending} onClick={() => run(canDownload)} className="w-full">
          {buttonText()}
        </Button>
        {isSubscription && access.hasActiveMembership && !access.creator && (
          <Button variant="outline" disabled={pending} onClick={() => run(false)} className="w-full">
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
          <Link href="/purchases" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            My Purchases →
          </Link>
        )}
      </div>
    </section>
  );
}
