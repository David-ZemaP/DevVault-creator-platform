import type { PublicationRecord } from '../supabase/types';
import { commerceDb, checked, entitlement, HttpError } from './marketplace-db';
import { HSK_CHAIN_ID } from '../web3/hsk';

export async function persistVerifiedPurchase(project: PublicationRecord, wallet: string, transactionHash: string, proof: { amount: string; confirmedBlock: number }) {
  const result = await commerceDb().from('purchases').insert({
    project_id: project.id, buyer_wallet: wallet, seller_wallet: project.creatorWallet.toLowerCase(),
    chain_id: HSK_CHAIN_ID, transaction_hash: transactionHash.toLowerCase(),
    payment_contract: project.lockAddress, amount: proof.amount, confirmed_block: proof.confirmedBlock,
  });
  if (!result.error) return;
  if (result.error.code !== '23505') {
    checked(result);
    return;
  }
  const existing = await entitlement(project.id, wallet);
  // Keep the original payment immutable. Renewal access is read from Unlock, not a replaced receipt.
  if (existing) return;
  throw new HttpError(409, 'Transaction has already been used');
}
