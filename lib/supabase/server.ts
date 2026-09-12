import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  UserRecord,
  PublicationRecord,
  CreatePublicationInput,
  CreateUserInput,
  dbRowToUserRecord,
  userRecordToDbRow,
  dbRowToPublicationRecord,
  publicationRecordToDbRow,
  DatabasePublicationRow,
  DatabaseUserRow,
} from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

/**
 * Check whether Supabase environment variables are real, valid credentials
 * (not missing and not default placeholders from .env.example)
 */
export function isSupabaseServerConfigured(): boolean {
  if (!supabaseUrl || !supabaseKey) return false;
  if (
    supabaseUrl.includes("your-project.supabase.co") ||
    supabaseUrl.includes("placeholder") ||
    !supabaseUrl.startsWith("http")
  ) {
    return false;
  }
  if (
    supabaseKey.includes("your_service_role_key") ||
    supabaseKey.includes("your_anon_key") ||
    supabaseKey.includes("placeholder") ||
    supabaseKey.length < 20
  ) {
    return false;
  }
  return true;
}

let cachedServerClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseServerConfigured() || !supabaseUrl || !supabaseKey) {
    return null;
  }
  if (!cachedServerClient) {
    cachedServerClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return cachedServerClient;
}

export const supabaseAdmin = isSupabaseServerConfigured()
  ? getSupabaseServerClient()
  : null;

// ============================================================================
// In-Memory Fallback Store (Used when Supabase credentials are not configured)
// ============================================================================

interface DevVaultMemoryStore {
  users: Map<string, UserRecord>;
  publications: Map<string, PublicationRecord>;
}

declare global {
  // eslint-disable-next-line no-var
  var __devvault_memory_store__: DevVaultMemoryStore | undefined;
}

const INITIAL_MOCK_USERS: UserRecord[] = [
  {
    wallet: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
    username: "avalanche_dev",
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
  },
  {
    wallet: "0x9812A4F9901fB9189280a82B8bfa4E06A2665972",
    username: "web3_creator",
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x9812A4F9901fB9189280a82B8bfa4E06A2665972",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString(),
  },
  {
    wallet: "0x3344556677889900112233445566778899001122",
    username: "zk_researcher",
    avatar: "https://api.dicebear.com/7.x/identicon/svg?seed=0x3344556677889900112233445566778899001122",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 14).toISOString(),
  },
];

const INITIAL_MOCK_PUBLICATIONS: PublicationRecord[] = [
  {
    id: "0xabc1230000000000000000000000000000000000000000000000000000000001",
    creatorWallet: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
    title: "Building High-Throughput Subnets on Avalanche",
    description:
      "A deep architectural dive into customizing EVM execution runtimes and gas parameters on dedicated Avalanche subnets.",
    preview:
      "Avalanche Subnets allow anyone to launch purpose-built blockchains with custom virtual machines and fee tokens. In this publication, we analyze throughput limits, state synchronization bottlenecks, and consensus parameter tuning for high-performance decentralized systems.",
    premiumContent:
      "Custom EVM bytecode optimizations and subnet validator staking parameters for production deployment. Step 1: define custom genesis with 100M gas limit per block. Step 2: configure Snowman++ consensus gossip intervals to 250ms. Step 3: verify EVM throughput using artillery load benchmarks.",
    contentHash: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    lockAddress: undefined,
    proofId: "0xabc1230000000000000000000000000000000000000000000000000000000001",
    avalancheTx: "0x892a014e36b819f72782e5b72e9894e63d41f5a9e3a61f5c0c283f6f1947b1c3",
    version: 1,
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    author: "0x71C8343e3C8432a688D37A33eC55f4175b9fF835",
    isGated: false,
  },
  {
    id: "0xabc1230000000000000000000000000000000000000000000000000000000002",
    creatorWallet: "0x9812A4F9901fB9189280a82B8bfa4E06A2665972",
    title: "Token-Gated Creator Monetization with Unlock Protocol",
    description:
      "Full guide and contract templates to tokenize your newsletter or video vault with self-sovereign NFT keys.",
    preview:
      "Unlock Protocol introduces time-bound NFT memberships natively on Avalanche C-Chain. Creators retain 100% custody of subscriber relationships without intermediary platform take rates.",
    premiumContent:
      "Exclusive unlock integration recipe: Deploy PublicLock via UnlockFactory on Fuji testnet. Configure keyPrice = 0.5 AVAX, expirationDuration = 30 days, maxNumberOfKeys = 1000. Hook your client validation to getHasValidKey(userAddress).",
    contentHash: "0x9f8377d017b2b0a1d56778f5f4b008d5e82b794d80587d40dd11b988f9f6b95b",
    lockAddress: "0x1234567890123456789012345678901234567890",
    proofId: "0xabc1230000000000000000000000000000000000000000000000000000000002",
    avalancheTx: "0x4b78912e81d856c4290fb43217ac5e80823c91e45980a37e19d084f7e2a9b31d",
    version: 1,
    createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
    author: "0x9812A4F9901fB9189280a82B8bfa4E06A2665972",
    isGated: true,
  },
  {
    id: "0xabc1230000000000000000000000000000000000000000000000000000000003",
    creatorWallet: "0x3344556677889900112233445566778899001122",
    title: "Content Provenance & Proof Registries on EVM",
    description:
      "How keccak256 hashes anchored on-chain protect creators against unauthorized AI scrapers and impersonation.",
    preview:
      "Proving provenance in the age of generative models is the primary barrier for independent research publishing. By registering cryptographic commitments on Avalanche, creators timestamp their IP with immutable validity.",
    premiumContent:
      "Smart contract implementation walkthrough: Store mapping(bytes32 => ContentProof) in your registry. On registration, emit ContentRegistered(contentId, author, hash, timestamp). Verify cryptographic proofs client-side using ethers.js keccak256(toUtf8Bytes(content)).",
    contentHash: "0x12d34e56f78a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
    lockAddress: undefined,
    proofId: "0xabc1230000000000000000000000000000000000000000000000000000000003",
    avalancheTx: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    version: 1,
    createdAt: new Date(Date.now() - 172800 * 1000).toISOString(),
    author: "0x3344556677889900112233445566778899001122",
    isGated: false,
  },
];

function getInMemoryStore(): DevVaultMemoryStore {
  if (!globalThis.__devvault_memory_store__) {
    const usersMap = new Map<string, UserRecord>();
    const publicationsMap = new Map<string, PublicationRecord>();

    for (const u of INITIAL_MOCK_USERS) {
      usersMap.set(u.wallet.toLowerCase(), { ...u });
    }
    for (const p of INITIAL_MOCK_PUBLICATIONS) {
      publicationsMap.set(p.id, { ...p });
    }

    globalThis.__devvault_memory_store__ = {
      users: usersMap,
      publications: publicationsMap,
    };
  }
  return globalThis.__devvault_memory_store__;
}

export function generatePublicationId(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return (
      "0x" +
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }
  return (
    "0x" +
    Math.random().toString(16).slice(2).padEnd(32, "0") +
    Math.random().toString(16).slice(2).padEnd(32, "0")
  );
}

// ============================================================================
// Unified Server Storage Service
// (Supabase with automatic In-Memory Fallback)
// ============================================================================

export const serverDb = {
  publications: {
    async list(creatorWallet?: string): Promise<PublicationRecord[]> {
      const client = getSupabaseServerClient();
      if (client) {
        try {
          let query = client
            .from("publications")
            .select("*")
            .order("created_at", { ascending: false });

          if (creatorWallet) {
            query = query.ilike("creator_wallet", creatorWallet);
          }

          const { data, error } = await query;
          if (!error && data) {
            return (data as DatabasePublicationRow[]).map(dbRowToPublicationRecord);
          }
          console.warn(
            "[DevVault Supabase] Falling back to in-memory publications store due to error:",
            error?.message
          );
        } catch (err: any) {
          console.warn(
            "[DevVault Supabase] Query failed, falling back to in-memory publications store:",
            err?.message
          );
        }
      }

      // In-Memory Fallback
      const store = getInMemoryStore();
      let list = Array.from(store.publications.values());
      if (creatorWallet) {
        const target = creatorWallet.toLowerCase();
        list = list.filter((p) => p.creatorWallet.toLowerCase() === target);
      }
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },

    async getById(id: string): Promise<PublicationRecord | null> {
      const client = getSupabaseServerClient();
      if (client) {
        try {
          const { data, error } = await client
            .from("publications")
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (!error && data) {
            return dbRowToPublicationRecord(data as DatabasePublicationRow);
          }
          if (error) {
            console.warn(
              "[DevVault Supabase] Falling back to in-memory publication store due to error:",
              error?.message
            );
          }
        } catch (err: any) {
          console.warn(
            "[DevVault Supabase] Query failed, falling back to in-memory publication store:",
            err?.message
          );
        }
      }

      // In-Memory Fallback
      const store = getInMemoryStore();
      return store.publications.get(id) || null;
    },

    async create(input: CreatePublicationInput): Promise<PublicationRecord> {
      const id = input.id || generatePublicationId();
      const createdAt = new Date().toISOString();
      const version = input.version ?? 1;

      const creatorWallet = input.creatorWallet.toLowerCase();
      const newRecord: PublicationRecord = {
        id,
        creatorWallet,
        title: input.title,
        description: input.description,
        preview: input.preview,
        premiumContent: input.premiumContent,
        contentHash: input.contentHash,
        lockAddress: input.lockAddress,
        proofId: input.proofId,
        avalancheTx: input.avalancheTx,
        version,
        projectType: input.projectType || "article",
        repositoryUrl: input.repositoryUrl,
        zipUrl: input.zipUrl,
        demoUrl: input.demoUrl,
        demoPreviewCode: input.demoPreviewCode,
        isHidden: Boolean(input.isHidden),
        createdAt,
        author: creatorWallet,
        isGated: Boolean(input.lockAddress && input.lockAddress.trim() !== ""),
      };

      const client = getSupabaseServerClient();
      if (client) {
        try {
          // Guarantee that user exists in Supabase users table to satisfy foreign key constraint
          await client.from("users").upsert(
            {
              wallet: creatorWallet,
              created_at: new Date().toISOString(),
            },
            { onConflict: "wallet", ignoreDuplicates: true }
          );

          const dbPayload = publicationRecordToDbRow(newRecord);
          const { data, error } = await client
            .from("publications")
            .insert(dbPayload)
            .select()
            .single();

          if (!error && data) {
            const saved = dbRowToPublicationRecord(data as DatabasePublicationRow);
            // Sync in-memory store
            getInMemoryStore().publications.set(saved.id, saved);
            return saved;
          }
          console.warn(
            "[DevVault Supabase] Insert failed, falling back to in-memory store:",
            error?.message
          );
        } catch (err: any) {
          console.warn(
            "[DevVault Supabase] Insert error, falling back to in-memory store:",
            err?.message
          );
        }
      }

      // In-Memory Fallback
      const store = getInMemoryStore();
      // Ensure creator user exists in mock user store
      if (!store.users.has(input.creatorWallet.toLowerCase())) {
        store.users.set(input.creatorWallet.toLowerCase(), {
          wallet: input.creatorWallet,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${input.creatorWallet}`,
          createdAt: new Date().toISOString(),
        });
      }
      store.publications.set(newRecord.id, newRecord);
      return newRecord;
    },
  },

  users: {
    async getByWallet(wallet: string): Promise<UserRecord | null> {
      const target = wallet.toLowerCase();
      const client = getSupabaseServerClient();
      if (client) {
        try {
          const { data, error } = await client
            .from("users")
            .select("*")
            .ilike("wallet", target)
            .maybeSingle();

          if (!error && data) {
            return dbRowToUserRecord(data as DatabaseUserRow);
          }
          if (error) {
            console.warn(
              "[DevVault Supabase] Falling back to in-memory user store due to error:",
              error?.message
            );
          }
        } catch (err: any) {
          console.warn(
            "[DevVault Supabase] Query failed, falling back to in-memory user store:",
            err?.message
          );
        }
      }

      // In-Memory Fallback
      const store = getInMemoryStore();
      return store.users.get(target) || null;
    },

    async upsert(input: CreateUserInput): Promise<UserRecord> {
      const target = input.wallet.toLowerCase();
      const existingUser = await this.getByWallet(target);

      const updatedRecord: UserRecord = {
        wallet: input.wallet,
        username: input.username !== undefined ? input.username : existingUser?.username,
        avatar:
          input.avatar !== undefined
            ? input.avatar
            : existingUser?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${input.wallet}`,
        createdAt: existingUser?.createdAt || new Date().toISOString(),
      };

      const client = getSupabaseServerClient();
      if (client) {
        try {
          const dbPayload = userRecordToDbRow(updatedRecord);
          const { data, error } = await client
            .from("users")
            .upsert(dbPayload, { onConflict: "wallet" })
            .select()
            .single();

          if (!error && data) {
            const saved = dbRowToUserRecord(data as DatabaseUserRow);
            getInMemoryStore().users.set(target, saved);
            return saved;
          }
          console.warn(
            "[DevVault Supabase] Upsert user failed, falling back to in-memory store:",
            error?.message
          );
        } catch (err: any) {
          console.warn(
            "[DevVault Supabase] Upsert user error, falling back to in-memory store:",
            err?.message
          );
        }
      }

      // In-Memory Fallback
      const store = getInMemoryStore();
      store.users.set(target, updatedRecord);
      return updatedRecord;
    },
  },
};
