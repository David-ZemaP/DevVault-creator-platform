'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';
import { createPublicClient, http, parseEther, formatEther, zeroAddress } from 'viem';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-modal';
import { marketplaceRequest, useWalletSession } from '@/lib/marketplace/client';
import { useAuth } from '@/lib/auth/use-auth';
import type { PublicationRecord } from '@/lib/supabase/types';
import { CONTENT_PROOF_REGISTRY_ABI, CONTENT_PROOF_REGISTRY_ADDRESS } from '@/lib/web3/contentProof';
import { avalancheFuji } from '@/lib/web3/chains';
import { getExplorerTxUrl } from '@/lib/web3/avalanche';
import { CreateLockSection } from '@/components/membership/create-lock-section';
import {
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Upload,
  CheckCircle2,
  FolderArchive,
  ArrowRight,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';

export default function CreatePublicationPage() {
  const { address, isConnected } = useAccount();
  const { data: wallet } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const authenticate = useWalletSession();
  const { authenticatedAddress } = useAuth();
  const { confirm } = useConfirm();

  const [project, setProject] = useState<PublicationRecord | null>(null);
  const [hasSource, setHasSource] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [demoVideoUrl, setDemoVideoUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [price, setPrice] = useState('');
  const [projectType, setProjectType] = useState<'software' | 'article'>('software');
  const [acquisitionModel, setAcquisitionModel] = useState<'lifetime' | 'subscription'>('lifetime');
  const [premiumContent, setPremiumContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [manageId, setManageId] = useState('');

  // Synchronize browser URL and wallet changes after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setManageId(new URLSearchParams(window.location.search).get('id') || '');
    setProject(null);
    setHasSource(false);
  }, [address, authenticatedAddress]);

  async function task(work: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await authenticate();
      await work();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  async function reload(id: string) {
    const result = await marketplaceRequest(`/publications/${id}/manage`);
    setProject(result.publication);
    setHasSource(result.hasSource);
    if (result.publication?.acquisitionModel) {
      setAcquisitionModel(result.publication.acquisitionModel);
    }
    if (result.publication?.repositoryUrl) {
      setRepositoryUrl(result.publication.repositoryUrl);
    }
  }

  const inputStyle =
    'w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none transition-colors dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-600';

  const needsLock = project
    ? (project.projectType === 'software' && !project.lockAddress) ||
      (project.projectType !== 'software' && project.acquisitionModel === 'subscription' && !project.lockAddress)
    : false;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-200" />
          <span>Creator Studio</span>
        </div>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          {project ? 'Manage project' : 'Create publication'}
        </h1>
        <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          Add a public showcase, upload private source, and publish when ready. HSKChain Testnet
          payments grant permanent source access.
        </p>
      </div>

      {message && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-zinc-700 dark:text-zinc-200 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {manageId && !project ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center space-y-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:shadow-none">
          <p className="text-zinc-700 text-xs font-medium dark:text-zinc-300">Session authentication required to edit project.</p>
          <Button
            disabled={busy || !isConnected}
            onClick={() => task(() => reload(manageId))}
          >
            {busy ? 'Authenticating...' : 'Sign in to manage project'}
          </Button>
        </div>
      ) : !project ? (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void task(async () => {
              const result = await marketplaceRequest('/publications', {
                title,
                description,
                preview: preview || description.slice(0, 180),
                demoUrl,
                demoVideoUrl,
                coverImage,
                priceWei: projectType === 'software' ? parseEther(price).toString() : undefined,
                projectType,
                premiumContent,
                acquisitionModel,
              });
              setProject(result.publication);
              setManageId(result.publication.id);
              window.history.replaceState(null, '', `/create?id=${result.publication.id}`);
              setMessage('Draft saved. Complete setup and publish when ready.');
            });
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-zinc-300">Publication type</span>
              <select
                className={inputStyle}
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as 'software' | 'article')}
              >
                <option value="software">Software & Code Package</option>
                <option value="article">Research Article</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-zinc-300">Title</span>
              <input
                required
                maxLength={180}
                placeholder="e.g. Next.js Web3 Starter Kit"
                className={inputStyle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-zinc-300">Short summary (public)</span>
            <input
              maxLength={1000}
              placeholder="Brief summary for listings and explore cards"
              className={inputStyle}
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-zinc-300">Full Description (public)</span>
            <textarea
              required
              maxLength={50000}
              rows={4}
              placeholder="Detailed overview of your project, tech stack, and what buyers will receive"
              className={inputStyle}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:shadow-none">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Live Showcase & Media</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Buyers can interact with your demo or view video before purchasing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Live demo URL (optional)</span>
                <input
                  type="url"
                  className={inputStyle}
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://demo.example.com"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Video demo URL (optional)</span>
                <input
                  type="url"
                  className={inputStyle}
                  value={demoVideoUrl}
                  onChange={(e) => setDemoVideoUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Public cover image URL (optional)</span>
              <input
                type="url"
                className={inputStyle}
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.example.com/cover.jpg"
              />
            </label>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:shadow-none">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Pricing & Token Gating</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Configure acquisition model and pricing on HSKChain Testnet.
              </p>
            </div>

            {projectType === 'software' && (
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-zinc-300">Acquisition Model</span>
                <select
                  className={inputStyle}
                  value={acquisitionModel}
                  onChange={(e) =>
                    setAcquisitionModel(e.target.value as 'lifetime' | 'subscription')
                  }
                >
                  <option value="lifetime">Lifetime Purchase · One-time permanent access</option>
                  <option value="subscription">
                    Monthly Subscription · 30-day recurring access via Unlock
                  </option>
                </select>
              </label>
            )}

            {projectType === 'software' ? (
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-zinc-300">Price in HSK</span>
                <input
                  required
                  inputMode="decimal"
                  pattern="[0-9]+(\.[0-9]{1,18})?"
                  placeholder="e.g. 5"
                  className={inputStyle}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <p className="text-xs text-zinc-500">You will configure the payment contract in the next step.</p>
              </label>
            ) : (
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-zinc-300">Premium article content</span>
                <textarea
                  className={inputStyle}
                  rows={3}
                  value={premiumContent}
                  onChange={(e) => setPremiumContent(e.target.value)}
                />
              </label>
            )}
          </section>

          <Button type="submit" disabled={busy || !isConnected}>
            {busy ? 'Saving...' : isConnected ? 'Save draft' : 'Connect wallet to create'}
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{project.title}</h2>
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${
                  project.status === 'PUBLISHED'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : project.status === 'DRAFT'
                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                }`}
              >
                {project.status}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed dark:text-zinc-300">{project.description}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-200 text-xs dark:border-zinc-800/80">
              {project.priceWei && (
                <div className="font-semibold text-zinc-900 dark:text-white">
                  {formatEther(BigInt(project.priceWei))} HSK{' '}
                  <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">· HSKChain Testnet</span>
                </div>
              )}

              {project.projectType === 'software' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">Model:</span>
                  <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    {project.acquisitionModel === 'subscription'
                      ? 'Monthly Subscription'
                      : 'Lifetime Purchase'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
              {project.demoUrl && (
                <a
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:underline dark:text-zinc-300 dark:hover:text-white"
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Preview live demo <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {project.demoVideoUrl && (
                <a
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-950 hover:underline dark:text-zinc-300 dark:hover:text-white"
                  href={project.demoVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Preview video <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {project.avalancheTx && (
                <a
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                  href={getExplorerTxUrl(project.avalancheTx)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ShieldCheck className="h-3 w-3" /> Verified Fuji proof transaction{' '}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </section>

          {project.status === 'DRAFT' && (
            <div className="space-y-4">
              {project.projectType === 'software' && (
                <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:shadow-none">
                  <div className="flex items-center gap-2">
                    <FolderArchive className="h-4 w-4 text-zinc-700 dark:text-zinc-200" />
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Private Source</h2>
                  </div>
                  {hasSource ? (
                    <div className="flex items-center gap-2 rounded border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Private source uploaded ✓</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Option A — Upload ZIP archive</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          ZIP only, up to 20 MiB. Remove secrets before upload. Uploaded archives are
                          immutable and encrypted on the server.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                          <input
                            aria-label="Private source ZIP"
                            type="file"
                            accept=".zip,application/zip"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="text-xs text-zinc-600 dark:text-zinc-400 file:mr-2.5 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-800 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-200 dark:hover:file:bg-zinc-700 cursor-pointer"
                          />
                          <Button
                            disabled={busy || !file}
                            onClick={() =>
                              task(async () => {
                                const data = new FormData();
                                data.set('file', file!);
                                await marketplaceRequest(`/publications/${project.id}/upload`, data);
                                await reload(project.id);
                              })
                            }
                            className="gap-1.5"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            Upload private source
                          </Button>
                        </div>
                      </div>

                      <div className="border-t border-zinc-800/80 pt-4 space-y-2">
                        <p className="text-xs font-medium text-zinc-200">Option B — GitHub / repository URL</p>
                        <p className="text-xs text-zinc-400">
                          Buyers with a valid purchase will receive this link. Use a private repo URL or a pre-signed link.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <input
                            type="url"
                            className={inputStyle}
                            placeholder="https://github.com/you/private-repo"
                            value={repositoryUrl}
                            onChange={(e) => setRepositoryUrl(e.target.value)}
                            aria-label="Repository URL"
                          />
                          <Button
                            variant="outline"
                            disabled={busy || !repositoryUrl}
                            onClick={() =>
                              task(async () => {
                                await marketplaceRequest(`/publications/${project.id}/set-repo`, { repositoryUrl });
                                await reload(project.id);
                                setMessage('Repository URL saved.');
                              })
                            }
                          >
                            Save repository URL
                          </Button>
                        </div>
                        {project.repositoryUrl && (
                          <p className="text-emerald-400 text-xs font-medium">Repository URL saved ✓</p>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Payment / membership lock configuration */}
              {project.projectType === 'software' && (
                project.lockAddress ? (
                  <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
                    <p className="text-emerald-400 text-xs sm:text-sm font-medium">Payment contract configured ✓</p>
                    <p className="font-mono text-xs text-zinc-400 break-all">{project.lockAddress}</p>
                    <p className="text-xs text-zinc-500">Buyers pay through this Unlock lock. Source access is permanent.</p>
                  </section>
                ) : (
                  <CreateLockSection
                    project={project}
                    mode="payment"
                    onLockSaved={(addr, priceWei) =>
                      setProject((prev) => (prev ? { ...prev, lockAddress: addr, priceWei } : prev))
                    }
                  />
                )
              )}

              {project.projectType !== 'software' && project.acquisitionModel === 'subscription' && (
                project.lockAddress ? (
                  <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1">
                    <p className="text-emerald-400 text-xs sm:text-sm font-medium">Membership contract configured ✓</p>
                    <p className="font-mono text-xs text-zinc-400 break-all">{project.lockAddress}</p>
                  </section>
                ) : (
                  <CreateLockSection
                    project={project}
                    onLockSaved={(addr, priceWei) =>
                      setProject((prev) => (prev ? { ...prev, lockAddress: addr, priceWei } : prev))
                    }
                  />
                )
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                {CONTENT_PROOF_REGISTRY_ADDRESS !== zeroAddress &&
                  project.lockAddress &&
                  !project.avalancheTx && (
                    <Button
                      disabled={busy}
                      variant="outline"
                      onClick={() =>
                        task(async () => {
                          if (!wallet || !address) throw new Error('Connect wallet');
                          await switchChainAsync({ chainId: avalancheFuji.id });
                          const hash = await wallet.writeContract({
                            account: address,
                            chain: avalancheFuji,
                            address: CONTENT_PROOF_REGISTRY_ADDRESS,
                            abi: CONTENT_PROOF_REGISTRY_ABI,
                            functionName: 'registerContent',
                            args: [
                              project.contentHash as `0x${string}`,
                              (project.lockAddress || zeroAddress) as `0x${string}`,
                              133n,
                            ],
                          });
                          const rpc = createPublicClient({ chain: avalancheFuji, transport: http() });
                          await rpc.waitForTransactionReceipt({ hash });
                          await marketplaceRequest(`/publications/${project.id}/proof`, {
                            transactionHash: hash,
                          });
                          await reload(project.id);
                        })
                      }
                      className="gap-1.5"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                      Anchor content proof on Avalanche Fuji (optional)
                    </Button>
                  )}

                <Button
                  disabled={
                    busy ||
                    (project.projectType === 'software' && !hasSource && !project.repositoryUrl) ||
                    needsLock
                  }
                  onClick={() =>
                    task(async () => {
                      const ok = await confirm({
                        title: 'Publish Project',
                        description: `Publish "${project.title}" to the DevVault marketplace? Your showcase demo will be visible to everyone and buyers will be able to purchase source access.`,
                        confirmText: 'Publish Project',
                        cancelText: 'Keep Editing',
                        variant: 'primary',
                        icon: 'help',
                      });
                      if (!ok) return;
                      await marketplaceRequest(`/publications/${project.id}/publish`, {});
                      await reload(project.id);
                      setMessage('Published. Demo is public; source remains private.');
                    })
                  }
                  variant="primary"
                >
                  {busy ? 'Checking...' : needsLock ? 'Configure payment contract first' : 'Publish project'}
                </Button>
              </div>
            </div>
          )}

          {project.status === 'PUBLISHED' && (
            <div className="flex items-center gap-3">
              <Link
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:underline dark:text-zinc-200 dark:hover:text-white"
                href={`/content/${project.id}`}
              >
                Open published project <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/80">
            {project.status === 'PUBLISHED' && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  task(async () => {
                    const ok = await confirm({
                      title: 'Archive Project',
                      description: `Are you sure you want to archive "${project.title}"? It will no longer be listed on the public marketplace and purchases will be disabled.`,
                      confirmText: 'Archive Project',
                      cancelText: 'Cancel',
                      variant: 'danger',
                      icon: 'trash',
                    });
                    if (!ok) return;
                    await marketplaceRequest(`/publications/${project.id}/archive`, {});
                    await reload(project.id);
                  })
                }
              >
                Archive project
              </Button>
            )}

            {hasSource && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  task(async () => {
                    const source = await marketplaceRequest(`/publications/${project.id}/source`);
                    window.location.assign(source.url);
                  })
                }
              >
                Access source code
              </Button>
            )}

            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors dark:text-zinc-400 dark:hover:text-white"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Create another publication
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
