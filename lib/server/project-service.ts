import { isAddress, keccak256, stringToBytes } from 'viem';
import { generatePublicationId } from '../supabase/server';
import { dbRowToPublicationRecord, type PublicationRecord } from '../supabase/types';
import { publicPublication, safeUrl } from '../marketplace/public';
import { checkPaymentConfig } from './payment-verifier';
import { verifyPublicationProof } from './provenance';
import { sourceStorage } from './source-storage';
import { commerceDb, checked, HttpError, jsonBody } from './marketplace-db';
import { Contract, getAddress, ZeroAddress } from 'ethers';
import { getHskProvider, assertHsk } from '../web3/membership';
import { UNLOCK_ADDRESS } from '../web3/hsk';
import { PUBLIC_LOCK_ABI } from '../web3/abis';

export async function createProject(wallet: string, body: Record<string, unknown>) {
  if (typeof body.title !== 'string' || !body.title.trim() || typeof body.description !== 'string' || !body.description.trim()) {
    throw new HttpError(400, 'Title and description required');
  }
  if (body.title.length > 180 || body.description.length > 50000) throw new HttpError(400, 'Project metadata is too long');
  for (const key of ['demoUrl', 'demoVideoUrl', 'coverImage']) {
    if (body[key] && (typeof body[key] !== 'string' || !safeUrl(body[key]))) throw new HttpError(400, `Invalid ${key}: use HTTPS (HTTP localhost only in development)`);
  }
  if (body.zipUrl || body.repositoryUrl || body.demoPreviewCode) throw new HttpError(400, 'Use private ZIP upload and public demo URLs');
  if (body.lockAddress && (typeof body.lockAddress !== 'string' || !isAddress(body.lockAddress))) throw new HttpError(400, 'Invalid lock address');
  if (body.projectType === 'software' && (typeof body.priceWei !== 'string' || !/^[0-9]{1,60}$/.test(body.priceWei) || BigInt(body.priceWei) <= 0n)) throw new HttpError(400, 'Positive HSK price required');
  const db = commerceDb();
  checked(await db.from('users').upsert({ wallet }, { onConflict: 'wallet', ignoreDuplicates: true }));
  const baseInsert = {
    id: generatePublicationId(), creator_wallet: wallet, title: body.title.trim(), description: body.description.trim(),
    preview: typeof body.preview === 'string' ? body.preview.slice(0, 1000) : body.description.slice(0, 180),
    premium_content: body.projectType === 'software' ? null : body.premiumContent,
    content_hash: keccak256(stringToBytes(body.description)), project_type: body.projectType === 'software' ? 'software' : 'article',
    demo_url: safeUrl(body.demoUrl as string), demo_video_url: safeUrl(body.demoVideoUrl as string), cover_image: safeUrl(body.coverImage as string),
    lock_address: typeof body.lockAddress === 'string' ? body.lockAddress.toLowerCase() : undefined,
    price_wei: body.priceWei, status: 'DRAFT',
  };
  const acquisitionModel = body.acquisitionModel === 'subscription' ? 'subscription' : 'lifetime';
  let result = await db.from('publications').insert({ ...baseInsert, acquisition_model: acquisitionModel }).select().single();
  // Resilience: if acquisition_model column not yet migrated, insert without it (defaults to 'lifetime')
  if (result.error?.code === 'PGRST204' && result.error.message.includes('acquisition_model')) {
    result = await db.from('publications').insert(baseInsert).select().single();
  }
  const row = checked(result);
  return publicPublication(dbRowToPublicationRecord(row));
}

export interface LockOnChainData {
  hasCode: boolean;
  version: bigint;
  tokenAddress: string;
  keyPrice: bigint;
  isLockManager: boolean;
  registeredWithFactory: boolean;
}

/** Pure synchronous lock data validation — no RPC calls. */
export function validateLockData(lockAddress: string, data: LockOnChainData): { priceWei: string } {
  if (!data.hasCode) throw new HttpError(400, 'Lock address has no contract code');
  if (data.version !== 15n) throw new HttpError(400, 'Expected a PublicLock v15 contract');
  if (getAddress(data.tokenAddress) !== ZeroAddress) throw new HttpError(400, 'Lock must accept native HSK, not an ERC-20 token');
  if (!data.isLockManager) throw new HttpError(400, 'Connected wallet must be a lock manager for this contract');
  if (!data.registeredWithFactory) throw new HttpError(400, 'Lock is not registered with the configured Unlock factory');
  return { priceWei: data.keyPrice.toString() };
}

/** Fetch on-chain data, validate, and save the lock address to a DRAFT publication. */
export async function validateAndSaveLock(
  id: string,
  project: PublicationRecord,
  wallet: string,
  lockAddress: unknown,
): Promise<{ lockAddress: string; priceWei: string }> {
  if (project.creatorWallet.toLowerCase() !== wallet) throw new HttpError(403, 'Only the creator can configure a membership lock');
  if (project.status !== 'DRAFT') throw new HttpError(409, 'Only draft projects can be updated');
  if (typeof lockAddress !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(lockAddress) || /^0x0{40}$/.test(lockAddress)) {
    throw new HttpError(400, 'Valid lock address required');
  }
  const provider = getHskProvider();
  await assertHsk(provider);
  const normalizedLock = getAddress(lockAddress);
  const code = await provider.getCode(normalizedLock);
  const lockContract = new Contract(normalizedLock, [
    ...PUBLIC_LOCK_ABI,
    'function isLockManager(address) view returns(bool)',
  ], provider);
  const factoryContract = new Contract(UNLOCK_ADDRESS, [
    'function locks(address) view returns(bool deployed,uint256 totalSales,uint256 yieldedDiscountTokens)',
  ], provider);
  const [version, token, keyPrice, isManager, registered] = await Promise.all([
    lockContract.publicLockVersion(),
    lockContract.tokenAddress(),
    lockContract.keyPrice(),
    lockContract.isLockManager(getAddress(project.creatorWallet)),
    factoryContract.locks(normalizedLock),
  ]);
  const { priceWei } = validateLockData(normalizedLock, {
    hasCode: Boolean(code && code !== '0x'),
    version: version as bigint,
    tokenAddress: token as string,
    keyPrice: keyPrice as bigint,
    isLockManager: isManager as boolean,
    registeredWithFactory: (registered as { deployed: boolean }).deployed,
  });
  const db = commerceDb();
  checked(await db.from('publications')
    .update({ lock_address: normalizedLock, price_wei: priceWei, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'DRAFT'));
  return { lockAddress: normalizedLock, priceWei };
}

export async function manageProject(project: PublicationRecord, wallet: string, action: string, request: Request) {
  if (project.creatorWallet.toLowerCase() !== wallet) throw new HttpError(403, 'Only the creator may manage this project');
  const db = commerceDb();
  if (action === 'archive') {
    checked(await db.from('publications').update({ status: 'ARCHIVED', updated_at: new Date().toISOString() }).eq('id', project.id));
    return { ok: true };
  }
  if (project.status !== 'DRAFT') throw new HttpError(409, 'Published projects are immutable; create a new project for revisions');
  if (action === 'upload') {
    const file = (await request.formData()).get('file');
    if (!(file instanceof File)) throw new HttpError(400, 'ZIP file required');
    await sourceStorage.upload(project.id, file);
    return { uploaded: true };
  }
  if (action === 'proof') {
    const { transactionHash } = await jsonBody(request);
    if (typeof transactionHash !== 'string') throw new HttpError(400, 'Proof transaction required');
    const proof = await verifyPublicationProof(project, transactionHash);
    checked(await db.from('publications').update(proof).eq('id', project.id).eq('status', 'DRAFT'));
    return { ok: true };
  }
  if (!project.title.trim() || !project.description?.trim()) throw new HttpError(400, 'Title and description required');
  if (project.projectType === 'software') {
    const hasRepoUrl = Boolean(project.repositoryUrl);
    if (!hasRepoUrl) {
      const artifact = checked(await db.from('source_artifacts').select('project_id').eq('project_id', project.id).maybeSingle());
      if (!artifact) throw new HttpError(400, 'Upload a private source archive or save a repository URL before publishing');
      await sourceStorage.download(project.id);
    }
    await checkPaymentConfig(project);
  }
  if (project.acquisitionModel === 'subscription' && project.projectType !== 'software') {
    const hasValidLock = project.lockAddress
      && /^0x[0-9a-fA-F]{40}$/.test(project.lockAddress)
      && !/^0x0{40}$/.test(project.lockAddress);
    if (!hasValidLock) throw new HttpError(400, 'Create your membership contract before publishing');
  }
  checked(await db.from('publications').update({ status: 'PUBLISHED', published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', project.id).eq('status', 'DRAFT'));
  return { published: true };
}
