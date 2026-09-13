import { authenticatedWallet } from '@/lib/server/wallet-session';
import { commerceDb, checked, apiError, privateJson } from '@/lib/server/marketplace-db';
import { publicPublication } from '@/lib/marketplace/public';
import { dbRowToPublicationRecord } from '@/lib/supabase/types';

export async function GET(request: Request) {
  try {
    const wallet = await authenticatedWallet();
    const sales = new URL(request.url).searchParams.get('sales') === 'true';
    const rows = checked(await commerceDb()
      .from('purchases')
      .select('*, publications(*)')
      .eq(sales ? 'seller_wallet' : 'buyer_wallet', wallet)
      .order('purchased_at', { ascending: false }));
    const purchases = (rows || []).map(row => ({
      ...row,
      publications: undefined,
      publication: publicPublication(dbRowToPublicationRecord(row.publications)),
    }));
    return privateJson({ purchases });
  } catch (error) {
    return apiError(error);
  }
}
