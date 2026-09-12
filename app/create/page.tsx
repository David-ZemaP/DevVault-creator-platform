'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';
import { createPublicClient, http, parseEther, formatEther, zeroAddress } from 'viem';
import { Button } from '@/components/ui/button';
import { marketplaceRequest, useWalletSession } from '@/lib/marketplace/client';
import type { PublicationRecord } from '@/lib/supabase/types';
import { CONTENT_PROOF_REGISTRY_ABI, CONTENT_PROOF_REGISTRY_ADDRESS } from '@/lib/web3/contentProof';
import { avalancheFuji } from '@/lib/web3/chains';
import { getExplorerTxUrl } from '@/lib/web3/avalanche';
export default function CreatePublicationPage() {
  const { address, isConnected } = useAccount();
  const { data: wallet } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const authenticate = useWalletSession();
  const [project, setProject] = useState<PublicationRecord | null>(null);
  const [hasSource, setHasSource] = useState(false);
  const [title, setTitle] = useState(''), [description, setDescription] = useState(''), [preview, setPreview] = useState('');
  const [demoUrl, setDemoUrl] = useState(''), [demoVideoUrl, setDemoVideoUrl] = useState(''), [coverImage, setCoverImage] = useState('');
  const [price, setPrice] = useState(''), [lockAddress, setLockAddress] = useState('');
  const [projectType, setProjectType] = useState<'software' | 'article'>('software');
  const [premiumContent, setPremiumContent] = useState('');
  const [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [manageId, setManageId] = useState('');
  // Synchronize browser URL and wallet changes after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setManageId(new URLSearchParams(window.location.search).get('id') || ''); setProject(null); setHasSource(false); }, [address]);
  async function task(work: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await authenticate(); await work(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Request failed'); } finally { setBusy(false); }
  }
  async function reload(id: string) {
    const result = await marketplaceRequest(`/publications/${id}/manage`);
    setProject(result.publication); setHasSource(result.hasSource);
  }
  const field = 'w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white';
  return <div className="max-w-3xl mx-auto space-y-6">
    <h1 className="text-3xl font-bold text-white">{project ? 'Manage project' : 'Create publication'}</h1>
    <p className="text-neutral-400">Add a public showcase, upload private source, and publish when ready. HSKChain Testnet payments grant permanent source access.</p>
    {message && <p role="status" className="rounded-lg border border-neutral-700 p-4">{message}</p>}
    {manageId && !project ? <Button disabled={busy || !isConnected} onClick={() => task(() => reload(manageId))}>Sign in to manage project</Button> : !project ? <form className="space-y-5" onSubmit={e => { e.preventDefault(); void task(async () => {
      const result = await marketplaceRequest('/publications', { title, description, preview: preview || description.slice(0, 180), demoUrl, demoVideoUrl, coverImage, priceWei: projectType === 'software' ? parseEther(price).toString() : undefined, lockAddress: lockAddress || undefined, projectType, premiumContent });
      setProject(result.publication); setManageId(result.publication.id);
      window.history.replaceState(null, '', `/create?id=${result.publication.id}`);
      setMessage('Draft saved. Upload source and review before publishing.');
    }); }}>
      <label className="block space-y-2"><span>Publication type</span><select className={field} value={projectType} onChange={e => setProjectType(e.target.value as 'software' | 'article')}><option value="software">Software & Code Package</option><option value="article">Research Article</option></select></label>
      <label className="block space-y-2"><span>Title</span><input required maxLength={180} className={field} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="block space-y-2"><span>Short summary (public)</span><input maxLength={1000} className={field} value={preview} onChange={e => setPreview(e.target.value)} /></label>
      <label className="block space-y-2"><span>Description (public)</span><textarea required maxLength={50000} rows={6} className={field} value={description} onChange={e => setDescription(e.target.value)} /></label>
      <section className="rounded-xl border border-neutral-800 p-5 space-y-4"><h2 className="font-semibold">Demo · public showcase</h2>
        <label className="block space-y-2"><span>Live demo URL (optional)</span><input type="url" className={field} value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://demo.example.com" /></label>
        <label className="block space-y-2"><span>Video demo URL (optional)</span><input type="url" className={field} value={demoVideoUrl} onChange={e => setDemoVideoUrl(e.target.value)} /></label>
        <label className="block space-y-2"><span>Public cover image URL (optional)</span><input type="url" className={field} value={coverImage} onChange={e => setCoverImage(e.target.value)} /></label>
        <p className="text-sm text-neutral-400">Use public showcase URLs only. Upload the private source archive after saving this draft.</p>
      </section>
      {projectType === 'software' ? <label className="block space-y-2"><span>Price in HSK</span><input required inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,18})?" className={field} value={price} onChange={e => setPrice(e.target.value)} /></label> : <label className="block space-y-2"><span>Premium article content</span><textarea className={field} value={premiumContent} onChange={e => setPremiumContent(e.target.value)} /></label>}
      <label className="block space-y-2"><span>Existing Unlock PublicLock v15 address on HSKChain Testnet</span><input required={projectType === 'software'} className={field} value={lockAddress} onChange={e => setLockAddress(e.target.value)} placeholder="0x…" /><p className="text-sm text-neutral-400">For software, you must manage this lock and its current native HSK price must match. The existing HSK lock tools remain available; no contract is deployed by this form.</p></label>
      <Button type="submit" disabled={busy || !isConnected}>{busy ? 'Saving...' : isConnected ? 'Save draft' : 'Connect wallet to create'}</Button>
    </form> : <div className="space-y-6">
      <section className="rounded-xl border border-neutral-800 p-6 space-y-3"><h2 className="text-xl font-semibold">{project.title}</h2><p>{project.description}</p><p>Status: {project.status}</p><p>{project.priceWei && `${formatEther(BigInt(project.priceWei))} HSK · HSKChain Testnet`}</p>
        {project.demoUrl && <a className="block text-red-400" href={project.demoUrl} target="_blank" rel="noopener noreferrer">Preview live demo ↗</a>}
        {project.demoVideoUrl && <a className="block text-red-400" href={project.demoVideoUrl} target="_blank" rel="noopener noreferrer">Preview video ↗</a>}
        {project.avalancheTx && <a className="block text-red-400" href={getExplorerTxUrl(project.avalancheTx)} target="_blank" rel="noopener noreferrer">Verified Fuji proof transaction ↗</a>}
      </section>
      {project.status === 'DRAFT' && <>
        {project.projectType === 'software' && <section className="rounded-xl border border-neutral-800 p-6 space-y-4"><h2 className="font-semibold">Private source archive</h2><p className="text-sm text-neutral-400">ZIP only, up to 20 MiB. Remove secrets before upload. Uploaded archives are immutable.</p>{hasSource ? <p className="text-emerald-400">Private source uploaded ✓</p> : <><input aria-label="Private source ZIP" type="file" accept=".zip,application/zip" onChange={e => setFile(e.target.files?.[0] || null)} /><Button disabled={busy || !file} onClick={() => task(async () => { const data = new FormData(); data.set('file', file!); await marketplaceRequest(`/publications/${project.id}/upload`, data); await reload(project.id); })}>Upload private source</Button></>}</section>}
        {CONTENT_PROOF_REGISTRY_ADDRESS !== zeroAddress && project.lockAddress && !project.avalancheTx && <Button disabled={busy} variant="outline" onClick={() => task(async () => {
          if (!wallet || !address) throw new Error('Connect wallet');
          await switchChainAsync({ chainId: avalancheFuji.id });
          const hash = await wallet.writeContract({ account: address, chain: avalancheFuji, address: CONTENT_PROOF_REGISTRY_ADDRESS, abi: CONTENT_PROOF_REGISTRY_ABI, functionName: 'registerContent', args: [project.contentHash as `0x${string}`, (project.lockAddress || zeroAddress) as `0x${string}`, 133n] });
          const rpc = createPublicClient({ chain: avalancheFuji, transport: http() });
          await rpc.waitForTransactionReceipt({ hash });
          await marketplaceRequest(`/publications/${project.id}/proof`, { transactionHash: hash }); await reload(project.id);
        })}>Anchor content proof on Avalanche Fuji (optional)</Button>}
        <Button disabled={busy || (project.projectType === 'software' && !hasSource)} onClick={() => task(async () => { await marketplaceRequest(`/publications/${project.id}/publish`, {}); await reload(project.id); setMessage('Published. Demo is public; source remains private.'); })}>{busy ? 'Checking...' : 'Publish project'}</Button>
      </>}
      {project.status === 'PUBLISHED' && <Link className="block text-red-400" href={`/content/${project.id}`}>Open published project →</Link>}
      {project.status === 'PUBLISHED' && <Button variant="outline" disabled={busy} onClick={() => task(async () => { await marketplaceRequest(`/publications/${project.id}/archive`, {}); await reload(project.id); })}>Archive project</Button>}
      {hasSource && <Button variant="outline" disabled={busy} onClick={() => task(async () => { const source = await marketplaceRequest(`/publications/${project.id}/source`); window.location.assign(source.url); })}>Access source code</Button>}
      <a href="/create" className="block text-red-400">Create another publication</a>
    </div>}
  </div>;
}
