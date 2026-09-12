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
export function SourcePurchase({ id, priceWei }: { id: string; priceWei?: string }) {
  const { address, isConnected } = useAccount();
  const { data: wallet } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const authenticate = useWalletSession();
  const [access, setAccess] = useState({ creator: false, purchased: false });
  const [pending, setPending] = useState(false), [message, setMessage] = useState('');
  const [tx, setTx] = useState('');
  const storageKey = `devvault:payment:${id}:${address?.toLowerCase()}`;
  useEffect(() => {
    let active = true;
    // Clear authorization display immediately when the connected wallet changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccess({ creator: false, purchased: false }); setTx(''); setMessage('');
    if (address) {
      setTx(localStorage.getItem(storageKey) || '');
      fetch('/api/auth/session', { cache: 'no-store' }).then(async r => {
        if (!r.ok || (await r.json()).wallet !== address.toLowerCase()) return;
        const data = await marketplaceRequest(`/publications/${id}/access`);
        if (active) { setAccess(data); if (data.transactionHash) setTx(data.transactionHash); }
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [address, id, storageKey]);
  const state = purchaseState(isConnected, access.creator, access.purchased, pending);
  async function run(download = false) {
    if (!isConnected) { openConnectModal?.(); return; }
    setPending(true); setMessage('');
    try {
      await authenticate();
      const current = await marketplaceRequest(`/publications/${id}/access`);
      setAccess(current);
      if (current.creator || current.purchased) {
        if (download) {
          const source = await marketplaceRequest(`/publications/${id}/source`);
          window.location.assign(source.url);
        }
        return;
      }
      let hash = tx || localStorage.getItem(storageKey);
      if (!hash) {
        const checkout = await marketplaceRequest(`/publications/${id}/checkout`, {});
        if (checkout.purchased || checkout.creator) { setAccess(checkout); return; }
        if (!window.confirm(`Buy source code for “${checkout.title}” for ${formatEther(BigInt(checkout.priceWei))} HSK on HSKChain Testnet? Gas is additional. Access is permanent.`)) return;
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
      setAccess(result); localStorage.removeItem(storageKey); setMessage('Purchased ✓ — permanent source access');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Purchase failed'); }
    finally { setPending(false); }
  }
  return <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4" aria-label="Source code">
    <h2 className="text-lg font-semibold text-white">Source code</h2>
    <p className="text-sm text-neutral-400">Private archive · permanent access after verified purchase</p>
    <p>{priceWei ? formatEther(BigInt(priceWei)) : '—'} HSK · HSKChain Testnet (133)</p>
    {state === 'creator' ? <p>Your project · <Link href={`/create?id=${id}`} className="text-red-400">Manage project</Link></p> : state === 'purchased' ? <p className="text-emerald-400">Purchased ✓</p> : null}
    <Button disabled={pending} onClick={() => run(state === 'creator' || state === 'purchased')}>
      {pending ? 'Waiting for confirmation...' : state === 'connect' ? 'Connect wallet to purchase' : state === 'creator' || state === 'purchased' ? 'Access source code' : tx ? 'Resume payment verification' : 'Buy source code'}
    </Button>
    {message && <p role="status" className="text-sm text-neutral-300">{message}</p>}
    {tx && <a href={getHskExplorerTxUrl(tx)} target="_blank" rel="noopener noreferrer" className="block text-sm text-red-400">View transaction</a>}
    {state === 'purchased' && <Link href="/purchases" className="block text-sm text-red-400">My Purchases</Link>}
  </section>;
}
