'use client';
import { useEffect, useState } from 'react';
import { useAccount, useConfig, useSwitchChain, useWalletClient } from 'wagmi';
import { createPublicClient, formatEther, http } from 'viem';
import { Interface } from 'ethers';
import { useAuth } from '@/lib/auth/use-auth';
import { marketplaceRequest } from '@/lib/marketplace/client';
import { HSK_CHAIN_ID, HSK_RPC_URL } from '@/lib/web3/hsk';
import { hashkeyTestnet } from '@/lib/web3/chains';
import { PUBLIC_LOCK_ABI, PURCHASE_SIGNATURE } from '@/lib/web3/abis';
import { nativePurchaseArgs } from '@/lib/web3/membership';
import { Button } from '@/components/ui/button';

type Phase =
  | 'idle'
  | 'connecting'
  | 'reauth_required'
  | 'switching_network'
  | 'ready'
  | 'awaiting_signature'
  | 'submitted'
  | 'confirming'
  | 'verifying'
  | 'confirmed'
  | 'failed';

interface Props {
  publicationId: string;
  lockAddress: string;
}

const BUSY_PHASES: Phase[] = [
  'connecting', 'switching_network', 'awaiting_signature',
  'submitted', 'confirming', 'verifying',
];

function subscribeLabel(
  phase: Phase,
  isMember: boolean,
  isConnected: boolean,
  isAuthenticated: boolean,
  chainId: number | undefined,
  price: bigint | undefined,
): string {
  if (phase === 'awaiting_signature') return 'Confirm in wallet...';
  if (phase === 'submitted') return 'Transaction submitted...';
  if (phase === 'confirming') return 'Waiting for confirmation...';
  if (phase === 'verifying') return 'Verifying membership...';
  if (phase === 'confirmed' || isMember) return 'Membership active ✓';
  if (phase === 'failed') return 'Purchase failed · Try again';
  if (!isConnected) return 'Connect wallet to subscribe';
  if (!isAuthenticated) return 'Re-authenticate wallet';
  if (chainId !== HSK_CHAIN_ID) return 'Switch to HashKey Chain Testnet';
  if (price === undefined) return 'Loading terms…';
  return `Subscribe — ${formatEther(price)} HSK`;
}

export function RealMembershipPurchase({ publicationId, lockAddress }: Props) {
  const { address, isConnected, chainId } = useAccount();
  const { data: wallet } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const auth = useAuth();

  const [phase, setPhase] = useState<Phase>('idle');
  const [price, setPrice] = useState<bigint>();
  const [duration, setDuration] = useState<bigint>();
  const [isMember, setIsMember] = useState(false);
  const [premium, setPremium] = useState<string>();
  const [error, setError] = useState('');

  // Load on-chain lock terms and current membership status.
  useEffect(() => {
    const client = createPublicClient({ chain: hashkeyTestnet, transport: http(HSK_RPC_URL) });
    let cancelled = false;

    const memberCheck = address
      ? client.readContract({ address: lockAddress as `0x${string}`, abi: PUBLIC_LOCK_ABI, functionName: 'getHasValidKey', args: [address] })
      : Promise.resolve(false as boolean);

    Promise.all([
      client.readContract({ address: lockAddress as `0x${string}`, abi: PUBLIC_LOCK_ABI, functionName: 'keyPrice' }),
      client.readContract({ address: lockAddress as `0x${string}`, abi: PUBLIC_LOCK_ABI, functionName: 'expirationDuration' }),
      memberCheck,
    ]).then(([nextPrice, nextDuration, activeMember]) => {
      if (cancelled) return;
      setPrice(nextPrice as bigint);
      setDuration(nextDuration as bigint);
      setIsMember(Boolean(activeMember));
      setPhase('ready');
    }).catch(() => {
      if (!cancelled) {
        setError('HashKey network is temporarily unavailable');
        setPhase('failed');
      }
    });

    return () => { cancelled = true; };
  }, [address, lockAddress]);

  // Fetch protected premium content when the wallet already has an active membership.
  useEffect(() => {
    if (!isMember || !auth.isSessionAuthenticated || premium !== undefined) return;
    marketplaceRequest(`/publications/${publicationId}/premium`)
      .then(data => {
        if (typeof data.premiumContent === 'string') setPremium(data.premiumContent);
      })
      .catch(() => {});
  }, [isMember, auth.isSessionAuthenticated, publicationId, premium]);

  async function subscribe() {
    if (!isConnected || !address) { setError('Connect wallet to subscribe'); return; }
    setError('');
    setPhase('connecting');

    try {
      // Ensure the SIWE session is established and matches the connected wallet.
      const sessionMismatch = !auth.isSessionAuthenticated
        || auth.authenticatedAddress?.toLowerCase() !== address.toLowerCase();
      if (sessionMismatch) {
        setPhase('reauth_required');
        await auth.login();
        // Confirm the fresh session corresponds to this wallet.
        const freshSession = await auth.refreshSession();
        if (!freshSession || freshSession.wallet.toLowerCase() !== address.toLowerCase()) {
          throw new Error('Re-authenticate wallet');
        }
      }

      // Switch to HashKey Testnet if the wallet is on a different chain.
      if (chainId !== HSK_CHAIN_ID) {
        setPhase('switching_network');
        await switchChainAsync({ chainId: HSK_CHAIN_ID });
      }

      if (!wallet || price === undefined) throw new Error('HashKey network is temporarily unavailable');

      // Encode and send the PublicLock purchase() transaction.
      setPhase('awaiting_signature');
      const purchaseData = new Interface(PUBLIC_LOCK_ABI).encodeFunctionData(
        PURCHASE_SIGNATURE,
        [nativePurchaseArgs(address)],
      ) as `0x${string}`;
      const txHash = await wallet.sendTransaction({
        account: address,
        chain: hashkeyTestnet,
        to: lockAddress as `0x${string}`,
        value: price,
        data: purchaseData,
      });

      setPhase('submitted');
      const client = createPublicClient({ chain: hashkeyTestnet, transport: http(HSK_RPC_URL) });

      setPhase('confirming');
      const receipt = await client.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });
      if (receipt.status !== 'success') throw new Error('Subscription transaction failed');

      // Backend verifies the transaction against the trusted lock before granting access.
      setPhase('verifying');
      await marketplaceRequest(`/publications/${publicationId}/membership-verify`, { transactionHash: txHash });

      // Confirm membership is active on-chain.
      const active = await client.readContract({
        address: lockAddress as `0x${string}`,
        abi: PUBLIC_LOCK_ABI,
        functionName: 'getHasValidKey',
        args: [address],
      });
      if (!active) throw new Error('Membership verification failed');

      setIsMember(true);
      setPhase('confirmed');

      // Fetch protected premium content now that membership is confirmed.
      const protectedContent = await marketplaceRequest(`/publications/${publicationId}/premium`);
      if (typeof protectedContent.premiumContent === 'string') {
        setPremium(protectedContent.premiumContent);
      }
    } catch (cause) {
      setPhase('failed');
      const message = cause instanceof Error ? cause.message : 'Purchase failed';
      setError(/reject|denied|cancel/i.test(message) ? 'Transaction cancelled' : message);
    }
  }

  const days = duration ? Number(duration) / 86400 : 0;
  const durationLabel = duration
    ? (days % 1 === 0 ? `${days} days` : `${Number(duration) / 3600} hours`)
    : '';
  const label = subscribeLabel(phase, isMember, isConnected, auth.isSessionAuthenticated, chainId, price);
  const isDisabled = BUSY_PHASES.includes(phase) || isMember;

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50 dark:shadow-none space-y-3"
      aria-label="Membership"
      data-purchase-state={phase}
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Membership</h2>
      {price !== undefined && (
        <p className="text-sm text-zinc-600 dark:text-neutral-400">
          {formatEther(price)} HSK{durationLabel ? ` · ${durationLabel}` : ''} · HSKChain Testnet
        </p>
      )}
      <Button disabled={isDisabled} onClick={() => void subscribe()}>
        {label}
      </Button>
      {error && <p role="alert" className="text-sm text-rose-600 dark:text-red-400">{error}</p>}
      {isMember && premium === undefined && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Membership active · loading content…</p>
      )}
      {premium !== undefined && (
        <article className="border-t border-zinc-200 pt-4 whitespace-pre-wrap text-zinc-800 dark:border-neutral-800 dark:text-neutral-200">
          {premium}
        </article>
      )}
    </section>
  );
}
