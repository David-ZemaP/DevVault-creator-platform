import { createPublicClient, http, decodeEventLog } from 'viem';
import { avalancheFuji } from '../web3/chains';
import { CONTENT_PROOF_REGISTRY_ABI, CONTENT_PROOF_REGISTRY_ADDRESS } from '../web3/contentProof';
import type { PublicationRecord } from '../supabase/types';
import { HttpError } from './marketplace-db';
export async function verifyPublicationProof(project: PublicationRecord, hash: string) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new HttpError(400, 'Invalid proof transaction');
  const rpc = createPublicClient({ chain: avalancheFuji, transport: http(process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL) });
  if (await rpc.getChainId() !== avalancheFuji.id) throw new HttpError(503, 'Invalid Fuji RPC');
  const receipt = await rpc.getTransactionReceipt({ hash: hash as `0x${string}` });
  if (receipt.status !== 'success') throw new HttpError(400, 'Proof transaction failed');
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== CONTENT_PROOF_REGISTRY_ADDRESS.toLowerCase()) continue;
    try {
      const event = decodeEventLog({ abi: CONTENT_PROOF_REGISTRY_ABI, ...log });
      if (event.eventName === 'ContentRegistered' && event.args.creator.toLowerCase() === project.creatorWallet.toLowerCase() && event.args.contentHash === project.contentHash && event.args.membershipLock.toLowerCase() === (project.lockAddress || '0x0000000000000000000000000000000000000000').toLowerCase() && event.args.membershipChainId === 133n) {
        return { avalanche_tx: hash, proof_id: event.args.contentId.toString() };
      }
    } catch { /* Only matching registry events are accepted. */ }
  }
  throw new HttpError(400, 'No matching Fuji content proof');
}
