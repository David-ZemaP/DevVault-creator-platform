/**
 * Supabase and Application Database Type Definitions
 * DevVault - Creator Platform
 */

export interface UserRecord {
  wallet: string;
  username?: string;
  avatar?: string;
  createdAt: string;
}

export interface PublicationRecord {
  id: string;
  creatorWallet: string;
  title: string;
  description?: string;
  preview: string;
  premiumContent?: string;
  contentHash: string;
  lockAddress?: string;
  proofId?: string;
  avalancheTx?: string;
  version: number;
  createdAt: string;
  // Optional convenience aliases for UI compatibility
  author?: string;
  isGated?: boolean;
}

export interface CreatePublicationInput {
  id?: string;
  creatorWallet: string;
  title: string;
  description?: string;
  preview: string;
  premiumContent?: string;
  contentHash: string;
  lockAddress?: string;
  proofId?: string;
  avalancheTx?: string;
  version?: number;
}

export interface CreateUserInput {
  wallet: string;
  username?: string;
  avatar?: string;
}

/**
 * Raw PostgreSQL / Supabase table row representations (snake_case)
 */
export interface DatabaseUserRow {
  wallet: string;
  username: string | null;
  avatar: string | null;
  created_at: string;
}

export interface DatabasePublicationRow {
  id: string;
  creator_wallet: string;
  title: string;
  description: string | null;
  preview: string;
  premium_content: string | null;
  content_hash: string;
  lock_address: string | null;
  proof_id: string | null;
  avalanche_tx: string | null;
  version: number;
  created_at: string;
}

/**
 * Transformers between Database Rows (snake_case) and Application Records (camelCase)
 */
export function dbRowToUserRecord(row: DatabaseUserRow): UserRecord {
  return {
    wallet: row.wallet,
    username: row.username ?? undefined,
    avatar: row.avatar ?? undefined,
    createdAt: row.created_at,
  };
}

export function userRecordToDbRow(record: Partial<UserRecord> & { wallet: string }): Partial<DatabaseUserRow> {
  return {
    wallet: record.wallet,
    ...(record.username !== undefined && { username: record.username || null }),
    ...(record.avatar !== undefined && { avatar: record.avatar || null }),
    ...(record.createdAt !== undefined && { created_at: record.createdAt }),
  };
}

export function dbRowToPublicationRecord(row: DatabasePublicationRow): PublicationRecord {
  const isGated = Boolean(row.lock_address && row.lock_address.trim() !== "");
  return {
    id: row.id,
    creatorWallet: row.creator_wallet,
    title: row.title,
    description: row.description ?? undefined,
    preview: row.preview,
    premiumContent: row.premium_content ?? undefined,
    contentHash: row.content_hash,
    lockAddress: row.lock_address ?? undefined,
    proofId: row.proof_id ?? undefined,
    avalancheTx: row.avalanche_tx ?? undefined,
    version: row.version ?? 1,
    createdAt: row.created_at,
    // Convenience fields
    author: row.creator_wallet,
    isGated,
  };
}

export function publicationRecordToDbRow(
  record: Partial<PublicationRecord> & { id: string; creatorWallet: string; title: string; preview: string; contentHash: string }
): DatabasePublicationRow {
  return {
    id: record.id,
    creator_wallet: record.creatorWallet,
    title: record.title,
    description: record.description || null,
    preview: record.preview,
    premium_content: record.premiumContent || null,
    content_hash: record.contentHash,
    lock_address: record.lockAddress || null,
    proof_id: record.proofId || null,
    avalanche_tx: record.avalancheTx || null,
    version: record.version ?? 1,
    created_at: record.createdAt || new Date().toISOString(),
  };
}
