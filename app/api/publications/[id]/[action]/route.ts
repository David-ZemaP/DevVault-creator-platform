import { persistVerifiedPurchase } from '@/lib/server/purchase-service';
import { authenticatedWallet, sameOrigin } from '@/lib/server/wallet-session';
import { commerceDb, checked, HttpError, apiError, privateJson, loadProject, entitlement, jsonBody } from '@/lib/server/marketplace-db';
import { sourceStorage } from '@/lib/server/source-storage';
import { checkPaymentConfig, paymentReference, validateMembershipEvidence, verifyPayment } from '@/lib/server/payment-verifier';
import { HSK_CHAIN_ID } from '@/lib/web3/hsk';
import { isPublic, publicPublication } from '@/lib/marketplace/public';
import { manageProject, validateAndSaveLock } from '@/lib/server/project-service';
import { projectAccess, requireSourceAccess } from '@/lib/server/source-access';
import { getHskProvider, hasMembership } from '@/lib/web3/membership';
type Props = { params: Promise<{ id: string; action: string }> };
export async function GET(_request: Request, props: Props) {
  try {
    const wallet = await authenticatedWallet();
    const { id, action } = await props.params;
    const project = await loadProject(id);
    const creator = project.creatorWallet.toLowerCase() === wallet;
    if (action === 'manage' && creator) {
      const artifact = checked(await commerceDb().from('source_artifacts').select('project_id').eq('project_id', id).maybeSingle());
      return privateJson({ publication: { ...publicPublication(project), repositoryUrl: project.repositoryUrl }, hasSource: Boolean(artifact) });
    }
    if (action === 'access') return privateJson(await projectAccess(project, wallet));
    if (action === 'premium') {
      if (!project.lockAddress || !/^0x[0-9a-fA-F]{40}$/.test(project.lockAddress) || /^0x0{40}$/.test(project.lockAddress)) throw new HttpError(400, 'Subscription is not configured for this project');
      if (!creator && !(await hasMembership({ lockAddress: project.lockAddress, userAddress: wallet }))) throw new HttpError(403, 'Active membership required');
      return privateJson({ premiumContent: project.premiumContent });
    }
    if (action !== 'source') throw new HttpError(404, 'Unknown action');
    requireSourceAccess(await projectAccess(project, wallet));
    const artifact = checked(await commerceDb().from('source_artifacts').select('project_id').eq('project_id', id).maybeSingle());
    if (!artifact && project.repositoryUrl) return privateJson({ url: project.repositoryUrl });
    return privateJson(await sourceStorage.download(id));
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(request: Request, props: Props) {
  try {
    sameOrigin(request);
    const wallet = await authenticatedWallet();
    const { id, action } = await props.params;
    const project = await loadProject(id);
    const creator = project.creatorWallet.toLowerCase() === wallet;
    if (action === 'membership-verify') {
      if (!project.lockAddress || !/^0x[0-9a-fA-F]{40}$/.test(project.lockAddress) || /^0x0{40}$/.test(project.lockAddress)) throw new HttpError(400, 'Subscription is not configured for this project');
      const body = await jsonBody(request);
      if (typeof body.transactionHash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(body.transactionHash)) throw new HttpError(400, 'Transaction hash required');
      const provider = getHskProvider();
      const [network, tx, receipt] = await Promise.all([
        provider.getNetwork(),
        provider.getTransaction(body.transactionHash),
        provider.getTransactionReceipt(body.transactionHash),
      ]);
      if (network.chainId !== 133n) throw new HttpError(503, 'HashKey network is temporarily unavailable');
      const { confirmedBlock } = validateMembershipEvidence(project.lockAddress, wallet, {
        chainId: network.chainId,
        tx: tx ? { from: tx.from, to: tx.to, data: tx.data, hash: tx.hash } : null,
        receipt: receipt ? { status: receipt.status, blockNumber: receipt.blockNumber, hash: receipt.hash } : null,
      });
      if (!(await hasMembership({ lockAddress: project.lockAddress, userAddress: wallet }, { provider, blockNumber: confirmedBlock }))) throw new HttpError(422, 'Membership is not active');
      return privateJson({ verified: true, transactionHash: body.transactionHash });
    }
    if (action === 'set-lock') {
      const body = await jsonBody(request);
      const result = await validateAndSaveLock(id, project, wallet, body.lockAddress);
      return privateJson(result);
    }
    if (action === 'set-repo') {
      if (!creator) throw new HttpError(403, 'Only the creator can set the repository URL');
      if (project.status !== 'DRAFT') throw new HttpError(409, 'Only draft projects can be updated');
      const body = await jsonBody(request);
      const { safeUrl } = await import('@/lib/marketplace/public');
      const url = safeUrl(typeof body.repositoryUrl === 'string' ? body.repositoryUrl : '');
      if (!url) throw new HttpError(400, 'Valid HTTPS repository URL required');
      checked(await commerceDb().from('publications').update({ repository_url: url, updated_at: new Date().toISOString() }).eq('id', id).eq('status', 'DRAFT'));
      return privateJson({ repositoryUrl: url });
    }
    if (['upload', 'publish', 'archive', 'proof'].includes(action)) {
      return privateJson(await manageProject(project, wallet, action, request));
    }
    if (!['checkout', 'verify'].includes(action)) throw new HttpError(404, 'Unknown action');
    if (project.projectType !== 'software') throw new HttpError(400, 'Source purchases apply to software');
    const existing = await entitlement(id, wallet);
    if (project.acquisitionModel !== 'subscription' && (existing || creator)) {
      return privateJson({ purchased: Boolean(existing), creator, transactionHash: existing?.transaction_hash });
    }
    if (project.acquisitionModel === 'subscription' && creator) {
      return privateJson({ purchased: false, creator: true });
    }
    if (action === 'checkout') {
      if (!isPublic(project)) throw new HttpError(404, 'Project is unavailable');
      await checkPaymentConfig(project);
      return privateJson({
        chainId: HSK_CHAIN_ID,
        lockAddress: project.lockAddress,
        priceWei: project.priceWei,
        data: paymentReference(id),
        title: project.title,
        acquisitionModel: project.acquisitionModel || 'lifetime',
      });
    }
    // Archived projects still accept payment proofs sent before archival.
    if (!project.publishedAt) throw new HttpError(400, 'Project has never been published');
    const { transactionHash } = await jsonBody(request);
    if (typeof transactionHash !== 'string') throw new HttpError(400, 'Transaction hash required');
    const proof = await verifyPayment(project, wallet, transactionHash);
    await persistVerifiedPurchase(project, wallet, transactionHash, proof);
    return privateJson({ purchased: true, transactionHash });
  } catch (error) {
    return apiError(error);
  }
}
