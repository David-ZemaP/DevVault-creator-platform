'use client';
import { useAuth } from '@/lib/auth/use-auth';
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
import { CreateLockSection } from '@/components/membership/create-lock-section';

export default function CreatePublicationPage() {
  const { address, isConnected } = useAccount();
  const { data: wallet } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const authenticate = useWalletSession();
  const { authenticatedAddress } = useAuth();
  const [project, setProject] = useState<PublicationRecord | null>(null);
  const [hasSource, setHasSource] = useState(false);
  const [title, setTitle] = useState(''), [description, setDescription] = useState(''), [preview, setPreview] = useState('');
  const [demoUrl, setDemoUrl] = useState(''), [demoVideoUrl, setDemoVideoUrl] = useState(''), [coverImage, setCoverImage] = useState('');
  const [price, setPrice] = useState('');
  const [projectType, setProjectType] = useState<'software' | 'article'>('software');
  const [acquisitionModel, setAcquisitionModel] = useState<'lifetime' | 'subscription'>('lifetime');
  const [premiumContent, setPremiumContent] = useState('');
  const [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [manageId, setManageId] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');

  // Synchronize browser URL and wallet changes after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setManageId(new URLSearchParams(window.location.search).get('id') || ''); setProject(null); setHasSource(false); }, [address, authenticatedAddress]);

  async function task(work: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await authenticate(); await work(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Request failed'); } finally { setBusy(false); }
  }

  async function reload(id: string) {
    const result = await marketplaceRequest(`/publications/${id}/manage`);
    setProject(result.publication); setHasSource(result.hasSource);
    if (result.publication?.acquisitionModel) setAcquisitionModel(result.publication.acquisitionModel);
    if (result.publication?.repositoryUrl) setRepositoryUrl(result.publication.repositoryUrl);
  }

  const field = 'w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white';

  // A software project needs a payment lock before it can be published.
  // A subscription article needs a membership lock before it can be published.
  const needsLock = project
    ? (project.projectType === 'software' && !project.lockAddress) ||
      (project.projectType !== 'software' && project.acquisitionModel === 'subscription' && !project.lockAddress)
    : false;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">{project ? 'Manage project' : 'Create publication'}</h1>
      <p className="text-neutral-400">
        Add a public showcase, upload private source, and publish when ready.
        {' '}HSKChain Testnet payments grant permanent source access.
      </p>
      {message && <p role="status" className="rounded-lg border border-neutral-700 p-4">{message}</p>}

      {/* ── LOAD EXISTING PROJECT ── */}
      {manageId && !project ? (
        <Button disabled={busy || !isConnected} onClick={() => task(() => reload(manageId))}>
          Sign in to manage project
        </Button>
      ) : !project ? (
        /* ── CREATION FORM ── */
        <form className="space-y-5" onSubmit={e => {
          e.preventDefault();
          void task(async () => {
            const result = await marketplaceRequest('/publications', {
              title, description,
              preview: preview || description.slice(0, 180),
              demoUrl, demoVideoUrl, coverImage,
              priceWei: projectType === 'software' ? parseEther(price).toString() : undefined,
              projectType, premiumContent, acquisitionModel,
            });
            setProject(result.publication);
            setManageId(result.publication.id);
            window.history.replaceState(null, '', `/create?id=${result.publication.id}`);
            setMessage('Draft saved. Complete setup and publish when ready.');
          });
        }}>
          <label className="block space-y-2">
            <span>Publication type</span>
            <select className={field} value={projectType} onChange={e => setProjectType(e.target.value as 'software' | 'article')}>
              <option value="software">Software & Code Package</option>
              <option value="article">Research Article</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span>Title</span>
            <input required maxLength={180} className={field} value={title} onChange={e => setTitle(e.target.value)} />
          </label>
          <label className="block space-y-2">
            <span>Short summary (public)</span>
            <input maxLength={1000} className={field} value={preview} onChange={e => setPreview(e.target.value)} />
          </label>
          <label className="block space-y-2">
            <span>Description (public)</span>
            <textarea required maxLength={50000} rows={6} className={field} value={description} onChange={e => setDescription(e.target.value)} />
          </label>

          <section className="rounded-xl border border-neutral-800 p-5 space-y-4">
            <h2 className="font-semibold">Demo · public showcase</h2>
            <label className="block space-y-2">
              <span>Live demo URL (optional)</span>
              <input type="url" className={field} value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://demo.example.com" />
            </label>
            <label className="block space-y-2">
              <span>Video demo URL (optional)</span>
              <input type="url" className={field} value={demoVideoUrl} onChange={e => setDemoVideoUrl(e.target.value)} />
            </label>
            <label className="block space-y-2">
              <span>Public cover image URL (optional)</span>
              <input type="url" className={field} value={coverImage} onChange={e => setCoverImage(e.target.value)} />
            </label>
            <p className="text-sm text-neutral-400">Upload the private source archive after saving this draft.</p>
          </section>

          <label className="block space-y-2">
            <span>Acquisition Model</span>
            <select className={field} value={acquisitionModel} onChange={e => setAcquisitionModel(e.target.value as 'lifetime' | 'subscription')}>
              {projectType === 'software'
                ? <>
                  <option value="lifetime">Lifetime Purchase · One-time permanent access</option>
                  <option value="subscription">Monthly Subscription · 30-day recurring access via Unlock</option>
                </>
                : <>
                  <option value="lifetime">Free article · Public preview only</option>
                  <option value="subscription">Premium article · Subscription-gated via Unlock</option>
                </>}
            </select>
          </label>

          {projectType === 'software'
            ? <label className="block space-y-2">
              <span>Price in HSK</span>
              <input required inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,18})?" className={field} value={price} onChange={e => setPrice(e.target.value)} />
              <p className="text-sm text-neutral-400">You will configure the payment contract in the next step.</p>
            </label>
            : <label className="block space-y-2">
              <span>Premium article content (private, gated by membership)</span>
              <textarea className={field} rows={4} value={premiumContent} onChange={e => setPremiumContent(e.target.value)} />
            </label>}

          <Button type="submit" disabled={busy || !isConnected}>
            {busy ? 'Saving...' : isConnected ? 'Save draft' : 'Connect wallet to create'}
          </Button>
        </form>
      ) : (
        /* ── MANAGEMENT VIEW ── */
        <div className="space-y-6">
          {/* Project summary */}
          <section className="rounded-xl border border-neutral-800 p-6 space-y-3">
            <h2 className="text-xl font-semibold">{project.title}</h2>
            <p className="text-neutral-400">{project.description}</p>
            <p className="text-sm">Status: <span className="font-medium">{project.status}</span></p>
            {project.priceWei && <p className="text-sm">{formatEther(BigInt(project.priceWei))} HSK · HSKChain Testnet</p>}
            {project.projectType === 'software' && (
              <p className="flex items-center gap-2 text-sm">
                <span>Acquisition Model:</span>
                <span className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
                  {project.acquisitionModel === 'subscription' ? 'Monthly Subscription' : 'Lifetime Purchase'}
                </span>
              </p>
            )}
            {project.demoUrl && <a className="block text-red-400 text-sm" href={project.demoUrl} target="_blank" rel="noopener noreferrer">Preview live demo ↗</a>}
            {project.demoVideoUrl && <a className="block text-red-400 text-sm" href={project.demoVideoUrl} target="_blank" rel="noopener noreferrer">Preview video ↗</a>}
            {project.avalancheTx && <a className="block text-red-400 text-sm" href={getExplorerTxUrl(project.avalancheTx)} target="_blank" rel="noopener noreferrer">Verified Fuji proof transaction ↗</a>}
          </section>

          {project.status === 'DRAFT' && <>
            {/* Source upload — software only */}
            {project.projectType === 'software' && (
              <section className="rounded-xl border border-neutral-800 p-6 space-y-4">
                <h2 className="font-semibold">Private source</h2>
                {hasSource
                  ? <p className="text-emerald-400">Private source archive uploaded ✓</p>
                  : <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-neutral-300">Option A — Upload ZIP archive</p>
                      <p className="text-sm text-neutral-400">ZIP only, up to 20 MiB. Remove secrets before upload. Immutable once uploaded.</p>
                      <input aria-label="Private source ZIP" type="file" accept=".zip,application/zip" onChange={e => setFile(e.target.files?.[0] || null)} />
                      <Button disabled={busy || !file} onClick={() => task(async () => {
                        const data = new FormData();
                        data.set('file', file!);
                        await marketplaceRequest(`/publications/${project.id}/upload`, data);
                        await reload(project.id);
                      })}>Upload private source</Button>
                    </div>
                    <div className="border-t border-neutral-800 pt-4 space-y-2">
                      <p className="text-sm font-medium text-neutral-300">Option B — GitHub / repository URL</p>
                      <p className="text-sm text-neutral-400">Buyers with a valid purchase will receive this link. Use a private repo URL or a pre-signed link.</p>
                      <input
                        type="url"
                        className={field}
                        placeholder="https://github.com/you/private-repo"
                        value={repositoryUrl}
                        onChange={e => setRepositoryUrl(e.target.value)}
                        aria-label="Repository URL"
                      />
                      <Button
                        variant="outline"
                        disabled={busy || !repositoryUrl}
                        onClick={() => task(async () => {
                          await marketplaceRequest(`/publications/${project.id}/set-repo`, { repositoryUrl });
                          await reload(project.id);
                          setMessage('Repository URL saved.');
                        })}
                      >
                        Save repository URL
                      </Button>
                      {project.repositoryUrl && (
                        <p className="text-emerald-400 text-sm">Repository URL saved ✓</p>
                      )}
                    </div>
                  </>}
              </section>
            )}

            {/* Payment / membership lock configuration */}
            {project.projectType === 'software' && (
              project.lockAddress
                ? <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
                  <p className="text-emerald-400 text-sm font-medium">Payment contract configured ✓</p>
                  <p className="font-mono text-xs text-neutral-400 break-all">{project.lockAddress}</p>
                  <p className="text-xs text-neutral-500">Buyers pay through this Unlock lock. Source access is permanent.</p>
                </section>
                : <CreateLockSection
                  project={project}
                  mode="payment"
                  onLockSaved={(addr, priceWei) => setProject(prev => prev ? { ...prev, lockAddress: addr, priceWei } : prev)}
                />
            )}

            {project.projectType !== 'software' && project.acquisitionModel === 'subscription' && (
              project.lockAddress
                ? <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
                  <p className="text-emerald-400 text-sm font-medium">Membership contract configured ✓</p>
                  <p className="font-mono text-xs text-neutral-400 break-all">{project.lockAddress}</p>
                </section>
                : <CreateLockSection
                  project={project}
                  onLockSaved={(addr, priceWei) => setProject(prev => prev ? { ...prev, lockAddress: addr, priceWei } : prev)}
                />
            )}

            {/* Optional Avalanche Fuji content proof */}
            {CONTENT_PROOF_REGISTRY_ADDRESS !== zeroAddress && project.lockAddress && !project.avalancheTx && (
              <Button disabled={busy} variant="outline" onClick={() => task(async () => {
                if (!wallet || !address) throw new Error('Connect wallet');
                await switchChainAsync({ chainId: avalancheFuji.id });
                const hash = await wallet.writeContract({
                  account: address, chain: avalancheFuji,
                  address: CONTENT_PROOF_REGISTRY_ADDRESS,
                  abi: CONTENT_PROOF_REGISTRY_ABI,
                  functionName: 'registerContent',
                  args: [project.contentHash as `0x${string}`, (project.lockAddress || zeroAddress) as `0x${string}`, 133n],
                });
                const rpc = createPublicClient({ chain: avalancheFuji, transport: http() });
                await rpc.waitForTransactionReceipt({ hash });
                await marketplaceRequest(`/publications/${project.id}/proof`, { transactionHash: hash });
                await reload(project.id);
              })}>
                Anchor content proof on Avalanche Fuji (optional)
              </Button>
            )}

            {/* Publish */}
            <Button
              disabled={busy || (project.projectType === 'software' && !hasSource && !project.repositoryUrl) || needsLock}
              onClick={() => task(async () => {
                await marketplaceRequest(`/publications/${project.id}/publish`, {});
                await reload(project.id);
                setMessage('Published. Demo is public; source remains private.');
              })}
            >
              {busy ? 'Checking...' : needsLock ? 'Configure payment contract first' : 'Publish project'}
            </Button>
          </>}

          {project.status === 'PUBLISHED' && (
            <Link className="block text-red-400" href={`/content/${project.id}`}>Open published project →</Link>
          )}
          {project.status === 'PUBLISHED' && (
            <Button variant="outline" disabled={busy} onClick={() => task(async () => {
              await marketplaceRequest(`/publications/${project.id}/archive`, {});
              await reload(project.id);
            })}>Archive project</Button>
          )}
          {hasSource && (
            <Button variant="outline" disabled={busy} onClick={() => task(async () => {
              const source = await marketplaceRequest(`/publications/${project.id}/source`);
              window.location.assign(source.url);
            })}>Access source code</Button>
          )}
          <a href="/create" className="block text-red-400">Create another publication</a>
        </div>
      )}
    </div>
  );
}
