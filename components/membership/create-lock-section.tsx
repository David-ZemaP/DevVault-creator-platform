'use client';
import { useState } from 'react';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';
import { createPublicClient, http, parseEther } from 'viem';
import { useAuth } from '@/lib/auth/use-auth';
import { marketplaceRequest } from '@/lib/marketplace/client';
import { HSK_CHAIN_ID, HSK_RPC_URL, UNLOCK_ADDRESS } from '@/lib/web3/hsk';
import { hashkeyTestnet } from '@/lib/web3/chains';
import { UNLOCK_ABI_VIEM } from '@/lib/web3/abis';
import { encodeMembershipInitializer, extractNewLock } from '@/lib/web3/membership';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-modal';
import type { PublicationRecord } from '@/lib/supabase/types';

type LockPhase =
  | 'idle'
  | 'ready'
  | 'switching_network'
  | 'awaiting_signature'
  | 'submitted'
  | 'confirming'
  | 'extracting_lock'
  | 'saving'
  | 'confirmed'
  | 'failed';

interface Props {
  project: PublicationRecord;
  onLockSaved: (lockAddress: string, priceWei: string) => void;
  mode?: 'payment' | 'membership';
}

const BUSY_PHASES: LockPhase[] = [
  'switching_network', 'awaiting_signature', 'submitted',
  'confirming', 'extracting_lock', 'saving',
];

function lockButtonLabel(
  phase: LockPhase,
  isConnected: boolean,
  isAuthenticated: boolean,
  chainId: number | undefined,
  mode: 'payment' | 'membership',
): string {
  const kind = mode === 'payment' ? 'Payment' : 'Membership';
  if (phase === 'switching_network') return 'Switching to HashKey...';
  if (phase === 'awaiting_signature') return 'Confirm in wallet...';
  if (phase === 'submitted' || phase === 'confirming') return 'Creating PublicLock...';
  if (phase === 'extracting_lock') return 'Reading lock address...';
  if (phase === 'saving') return `Saving ${kind.toLowerCase()} contract...`;
  if (phase === 'confirmed') return `${kind} contract created ✓`;
  if (phase === 'failed') return 'Creation failed · Try again';
  if (!isConnected) return 'Connect wallet to create';
  if (!isAuthenticated) return 'Re-authenticate wallet';
  if (chainId !== HSK_CHAIN_ID) return 'Switch to HashKey Chain Testnet';
  return `Create ${kind} Contract`;
}

export function CreateLockSection({ project, onLockSaved, mode = 'membership' }: Props) {
  const { address, isConnected, chainId } = useAccount();
  const { data: wallet } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const auth = useAuth();
  const { confirm } = useConfirm();

  const [phase, setPhase] = useState<LockPhase>('idle');
  const [lockPrice, setLockPrice] = useState('0.0001');
  const [lockDurationDays, setLockDurationDays] = useState('30');
  const [lockMaxMembers, setLockMaxMembers] = useState('10000');
  const [createdLock, setCreatedLock] = useState('');
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [existingLock, setExistingLock] = useState('');

  async function createLock() {
    if (!isConnected || !address) { setError('Connect wallet to create a membership contract'); return; }
    const priceNum = parseFloat(lockPrice);
    if (!lockPrice || isNaN(priceNum) || priceNum <= 0) { setError('Enter a valid membership price greater than 0'); return; }
    const durationNum = parseInt(lockDurationDays, 10);
    if (!lockDurationDays || isNaN(durationNum) || durationNum <= 0) { setError('Enter a valid duration in days'); return; }
    const maxNum = parseInt(lockMaxMembers, 10);
    if (!lockMaxMembers || isNaN(maxNum) || maxNum <= 0) { setError('Enter a valid maximum members count'); return; }

    setError('');
    setPhase('ready');

    try {
      const sessionMismatch = !auth.isSessionAuthenticated
        || auth.authenticatedAddress?.toLowerCase() !== address.toLowerCase();
      if (sessionMismatch) {
        await auth.login();
        const freshSession = await auth.refreshSession();
        if (!freshSession || freshSession.wallet.toLowerCase() !== address.toLowerCase()) {
          throw new Error('Re-authenticate wallet');
        }
      }

      if (chainId !== HSK_CHAIN_ID) {
        setPhase('switching_network');
        await switchChainAsync({ chainId: HSK_CHAIN_ID });
      }
      if (!wallet) throw new Error('Wallet client not available');

      const priceWei = parseEther(lockPrice);
      const durationSeconds = BigInt(durationNum * 86400);
      const initData = encodeMembershipInitializer({
        creatorAddress: address,
        name: project.title,
        durationSeconds,
        priceWei,
        maxMembers: BigInt(maxNum),
      }) as `0x${string}`;

      const ok = await confirm({
        title: `Deploy ${kind} Contract`,
        description: `Deploy an on-chain PublicLock contract on HSKChain Testnet for "${project.title}".`,
        details: [
          { label: 'Key Price', value: `${lockPrice} HSK` },
          { label: 'Duration', value: `${lockDurationDays} days` },
          { label: 'Max Members', value: lockMaxMembers === '0' ? 'Unlimited' : lockMaxMembers },
          { label: 'Network', value: 'HSKChain Testnet (133)' },
        ],
        notice: 'This will broadcast a smart contract deployment transaction and requires gas.',
        confirmText: `Deploy ${kind} Contract`,
        cancelText: 'Cancel',
        variant: 'primary',
        icon: 'lock',
      });
      if (!ok) {
        setPhase('idle');
        return;
      }

      setPhase('awaiting_signature');
      const hash = await wallet.writeContract({
        account: address,
        chain: hashkeyTestnet,
        address: UNLOCK_ADDRESS as `0x${string}`,
        abi: UNLOCK_ABI_VIEM,
        functionName: 'createUpgradeableLockAtVersion',
        args: [initData, 15],
      });

      setPhase('submitted');
      const publicClient = createPublicClient({ chain: hashkeyTestnet, transport: http(HSK_RPC_URL) });

      setPhase('confirming');
      const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
      if (receipt.status !== 'success') throw new Error('Lock creation transaction failed');

      setPhase('extracting_lock');
      const lockAddress = extractNewLock(
        receipt.logs.map(l => ({ address: l.address, topics: [...l.topics], data: l.data })),
        address,
      );

      setPhase('saving');
      const result = await marketplaceRequest(`/publications/${project.id}/set-lock`, { lockAddress });

      setCreatedLock(lockAddress);
      setPhase('confirmed');
      onLockSaved(lockAddress, result.priceWei ?? priceWei.toString());
    } catch (cause) {
      setPhase('failed');
      const message = cause instanceof Error ? cause.message : 'Failed to create membership contract';
      setError(/reject|denied|cancel/i.test(message) ? 'Transaction cancelled' : message);
    }
  }

  async function saveExistingLock() {
    if (!/^0x[0-9a-fA-F]{40}$/.test(existingLock) || /^0x0{40}$/.test(existingLock)) {
      setError('Enter a valid Ethereum address');
      return;
    }
    setError('');
    setPhase('saving');
    try {
      const result = await marketplaceRequest(`/publications/${project.id}/set-lock`, { lockAddress: existingLock });
      setCreatedLock(existingLock);
      setPhase('confirmed');
      onLockSaved(existingLock, result.priceWei ?? '');
    } catch (cause) {
      setPhase('failed');
      setError(cause instanceof Error ? cause.message : 'Failed to save lock');
    }
  }

  const label = lockButtonLabel(phase, isConnected, auth.isSessionAuthenticated, chainId, mode);
  const isDisabled = BUSY_PHASES.includes(phase) || phase === 'confirmed';
  const field = 'w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white';

  const kind = mode === 'payment' ? 'Payment' : 'Membership';

  if (phase === 'confirmed' || createdLock) {
    return (
      <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-2" aria-label={`${kind} contract`}>
        <p className="text-emerald-400 font-medium">{kind} contract created ✓</p>
        <p className="font-mono text-xs text-neutral-400 break-all">{createdLock}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-800 p-6 space-y-4" aria-label={`Create ${kind.toLowerCase()} contract`} data-lock-phase={phase}>
      <h2 className="font-semibold text-white">{kind} Contract</h2>
      <p className="text-sm text-neutral-400">
        {mode === 'payment'
          ? 'Deploy an Unlock PublicLock v15 on HashKey Testnet. Buyers pay once for permanent source access.'
          : 'Deploy an Unlock PublicLock v15 on HashKey Testnet. Readers subscribe directly via the contract.'}
      </p>
      <label className="block space-y-2">
        <span className="text-sm text-neutral-300">Membership price (HSK)</span>
        <input
          type="text"
          inputMode="decimal"
          className={field}
          value={lockPrice}
          onChange={e => setLockPrice(e.target.value)}
          placeholder="0.0001"
          disabled={isDisabled}
          aria-label="Membership price in HSK"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-neutral-300">Duration (days)</span>
        <input
          type="number"
          min="1"
          max="3650"
          className={field}
          value={lockDurationDays}
          onChange={e => setLockDurationDays(e.target.value)}
          placeholder="30"
          disabled={isDisabled}
          aria-label="Membership duration in days"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-neutral-300">Maximum members</span>
        <input
          type="number"
          min="1"
          className={field}
          value={lockMaxMembers}
          onChange={e => setLockMaxMembers(e.target.value)}
          placeholder="10000"
          disabled={isDisabled}
          aria-label="Maximum number of members"
        />
      </label>
      <Button disabled={isDisabled} onClick={() => void createLock()}>
        {label}
      </Button>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <div>
        <button
          type="button"
          className="text-xs text-neutral-500 underline"
          onClick={() => setShowAdvanced(v => !v)}
        >
          {showAdvanced ? 'Hide advanced' : 'Use an existing PublicLock instead'}
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-2">
            <input
              className={field}
              placeholder="0x… existing PublicLock v15 on HashKey Testnet"
              value={existingLock}
              onChange={e => setExistingLock(e.target.value)}
              aria-label="Existing lock address"
            />
            <Button variant="outline" disabled={phase === 'saving'} onClick={() => void saveExistingLock()}>
              Validate and use this lock
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
