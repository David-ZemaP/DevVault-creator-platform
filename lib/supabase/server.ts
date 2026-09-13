import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  UserRecord,
  PublicationRecord,
  CreateUserInput,
  dbRowToUserRecord,
  dbRowToPublicationRecord,
  DatabasePublicationRow,
  DatabaseUserRow,
} from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// Server persistence requires the service-role key. Public anon keys belong only
// in the browser client and must never silently authorize commerce operations.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

// Public read-only service — used by server components and public API routes.
// When Supabase is unavailable, list() returns [] and getById() returns null so
// the caller renders an honest empty state instead of mock data.
export const serverDb = {
  publications: {
    async list(creatorWallet?: string): Promise<PublicationRecord[]> {
      const client = getSupabaseServerClient();
      if (!client) return [];
      try {
        let query = client
          .from("publications")
          .select("*")
          .order("created_at", { ascending: false });
        if (creatorWallet) {
          query = query.ilike("creator_wallet", creatorWallet);
        }
        const { data, error } = await query;
        if (error) {
          console.error("[DevVault] publications.list error:", error.message);
          return [];
        }
        return (data as DatabasePublicationRow[]).map(dbRowToPublicationRecord);
      } catch (err: unknown) {
        console.error("[DevVault] publications.list exception:", err);
        return [];
      }
    },

    async getById(id: string): Promise<PublicationRecord | null> {
      const client = getSupabaseServerClient();
      if (!client) return null;
      try {
        const { data, error } = await client
          .from("publications")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) {
          console.error("[DevVault] publications.getById error:", error.message);
          return null;
        }
        return data ? dbRowToPublicationRecord(data as DatabasePublicationRow) : null;
      } catch (err: unknown) {
        console.error("[DevVault] publications.getById exception:", err);
        return null;
      }
    },
  },

  users: {
    async getByWallet(wallet: string): Promise<UserRecord | null> {
      const client = getSupabaseServerClient();
      if (!client) return null;
      try {
        const { data, error } = await client
          .from("users")
          .select("*")
          .ilike("wallet", wallet.toLowerCase())
          .maybeSingle();
        if (error) {
          console.error("[DevVault] users.getByWallet error:", error.message);
          return null;
        }
        return data ? dbRowToUserRecord(data as DatabaseUserRow) : null;
      } catch (err: unknown) {
        console.error("[DevVault] users.getByWallet exception:", err);
        return null;
      }
    },

    async upsert(input: CreateUserInput): Promise<UserRecord> {
      const client = getSupabaseServerClient();
      if (!client) throw new Error("Database unavailable");
      const row = {
        wallet: input.wallet.toLowerCase(),
        ...(input.username !== undefined && { username: input.username || null }),
        ...(input.avatar !== undefined && { avatar: input.avatar || null }),
      };
      const { data, error } = await client
        .from("users")
        .upsert(row, { onConflict: "wallet" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return dbRowToUserRecord(data as DatabaseUserRow);
    },
  },
};
