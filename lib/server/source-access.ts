import type { PublicationRecord } from '../supabase/types';
import { hasMembership } from '../web3/membership';
import { entitlement, HttpError } from './marketplace-db';

export async function projectAccess(project: PublicationRecord, wallet: string) {
  const creator = project.creatorWallet.toLowerCase() === wallet;
  const purchase = await entitlement(project.id, wallet);
  const isSubscription = project.acquisitionModel === 'subscription';
  const hasActiveMembership = isSubscription && project.lockAddress
    ? await hasMembership({ lockAddress: project.lockAddress, userAddress: wallet }).catch(() => false)
    : false;
  return { creator, purchased: Boolean(purchase), isSubscription, hasActiveMembership, transactionHash: purchase?.transaction_hash };
}

export function requireSourceAccess(access: Awaited<ReturnType<typeof projectAccess>>) {
  if (access.creator) return;
  // Explicit subscription licenses retain their established on-chain membership semantics.
  if (access.isSubscription ? access.hasActiveMembership : access.purchased) return;
  throw new HttpError(403, access.isSubscription
    ? 'Active subscription required. Please renew your membership.'
    : 'Purchase source code to access this archive');
}
