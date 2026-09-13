import { commerceDb, checked, apiError, privateJson } from '@/lib/server/marketplace-db';

export async function GET() {
  try {
    // Verify connectivity and that all commerce tables exist.
    // Use wildcard selects to avoid column-existence failures from pending migrations.
    for (const t of ['wallet_sessions', 'wallet_challenges', 'publications', 'source_artifacts', 'purchases'] as const) {
      checked(await commerceDb().from(t).select('*').limit(0));
    }
    return privateJson({ database: 'ready' });
  } catch (error) {
    return apiError(error);
  }
}
