import { authenticatedWallet, sameOrigin } from '@/lib/server/wallet-session';
import { commerceDb, checked, HttpError, apiError, privateJson, loadProject, entitlement } from '@/lib/server/marketplace-db';
import { sourceStorage } from '@/lib/server/source-storage';
import { checkPaymentConfig, paymentReference, verifyPayment } from '@/lib/server/payment-verifier';
import { HSK_CHAIN_ID } from '@/lib/web3/hsk';
import { isPublic, publicPublication } from '@/lib/marketplace/public';
import { verifyPublicationProof } from '@/lib/server/provenance';
import { hasMembership } from '@/lib/web3/membership';
type Props = { params: Promise<{ id: string; action: string }> };
export async function GET(_request: Request, props: Props) {
  try {
    const wallet = await authenticatedWallet();
    const { id, action } = await props.params;
    const project = await loadProject(id);
    const creator = project.creatorWallet.toLowerCase() === wallet;
    const purchase = await entitlement(id, wallet);
    if (action === 'access') {
      if (project.acquisitionModel === 'subscription') {
        const activeMembership = project.lockAddress
          ? await hasMembership({ lockAddress: project.lockAddress, userAddress: wallet }).catch(() => false)
          : false;
        return privateJson({
          creator,
          purchased: Boolean(purchase),
          isSubscription: true,
          hasActiveMembership: Boolean(activeMembership),
          transactionHash: purchase?.transaction_hash,
        });
      }
      return privateJson({
        creator,
        purchased: Boolean(purchase),
        isSubscription: false,
        transactionHash: purchase?.transaction_hash,
      });
    }
    if (action === 'manage' && creator) {
      const artifact = checked(await commerceDb().from('source_artifacts').select('project_id').eq('project_id', id).maybeSingle());
      return privateJson({ publication: publicPublication(project), hasSource: Boolean(artifact) });
    }
    if (action !== 'source') throw new HttpError(404, 'Unknown action');
    if (project.acquisitionModel === 'subscription') {
      const active = creator || (project.lockAddress ? await hasMembership({ lockAddress: project.lockAddress, userAddress: wallet }).catch(() => false) : false);
      if (!active) throw new HttpError(403, 'Active subscription required. Please renew your membership.');
    } else {
      if (!creator && !purchase) throw new HttpError(403, 'Purchase source code to access this archive');
    }
    return privateJson(await sourceStorage.download(id));
  } catch (e) { return apiError(e); }
}
export async function POST(request: Request, props: Props) {
  try {
    sameOrigin(request);
    const wallet = await authenticatedWallet();
    const { id, action } = await props.params;
    const project = await loadProject(id), db = commerceDb();
    const creator = project.creatorWallet.toLowerCase() === wallet;
    if (['upload', 'publish', 'archive', 'proof'].includes(action)) {
      if (!creator) throw new HttpError(403, 'Only the creator may manage this project');
      if (action === 'archive') {
        checked(await db.from('publications').update({ status: 'ARCHIVED', updated_at: new Date().toISOString() }).eq('id', id));
        return privateJson({ ok: true });
      }
      if (project.status !== 'DRAFT') throw new HttpError(409, 'Published projects are immutable; create a new project for revisions');
      if (action === 'upload') {
        const file = (await request.formData()).get('file');
        if (!(file instanceof File)) throw new HttpError(400, 'ZIP file required');
        await sourceStorage.upload(id, file);
        return privateJson({ uploaded: true });
      }
      if (action === 'proof') {
        const { transactionHash } = await request.json();
        const proof = await verifyPublicationProof(project, transactionHash);
        checked(await db.from('publications').update(proof).eq('id', id).eq('status', 'DRAFT'));
        return privateJson({ ok: true });
      }
      if (!project.title.trim() || !project.description?.trim()) throw new HttpError(400, 'Title and description required');
      if (project.projectType === 'software') {
        const artifact = checked(await db.from('source_artifacts').select('object_key').eq('project_id', id).maybeSingle());
        if (!artifact) throw new HttpError(400, 'Upload private source before publishing');
        // A signing call also verifies that the bucket is private and the object exists.
        await sourceStorage.download(id);
        await checkPaymentConfig(project);
      }
      checked(await db.from('publications').update({ status: 'PUBLISHED', published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id).eq('status', 'DRAFT'));
      return privateJson({ published: true });
    }
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
    if (action !== 'verify') throw new HttpError(404, 'Unknown action');
    // Archived projects still accept payment proofs sent before archival.
    if (!project.publishedAt) throw new HttpError(400, 'Project has never been published');
    const { transactionHash } = await request.json();
    const proof = await verifyPayment(project, wallet, transactionHash);
    const result = await db.from('purchases').insert({ project_id: id, buyer_wallet: wallet, seller_wallet: project.creatorWallet.toLowerCase(), chain_id: HSK_CHAIN_ID,
      transaction_hash: transactionHash.toLowerCase(), payment_contract: project.lockAddress, amount: proof.amount, confirmed_block: proof.confirmedBlock });
    if (result.error) {
      const repeated = await entitlement(id, wallet);
      if (repeated) {
        if (project.acquisitionModel === 'subscription' && repeated.transaction_hash !== transactionHash.toLowerCase()) {
          try {
            await db.from('purchases').update({
              transaction_hash: transactionHash.toLowerCase(),
              amount: proof.amount,
              confirmed_block: proof.confirmedBlock,
              purchased_at: new Date().toISOString(),
            }).eq('id', repeated.id);
          } catch {}
        }
        return privateJson({ purchased: true, transactionHash });
      }
      if (result.error.code === '23505') throw new HttpError(409, 'Transaction has already been used');
      checked(result);
    }
    return privateJson({ purchased: true, transactionHash });
  } catch (e) { return apiError(e); }
}
