import { authenticatedWallet, sameOrigin } from "@/lib/server/wallet-session";
import { apiError, jsonBody } from "@/lib/server/marketplace-db";
import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase/server";
import type { CreateUserInput } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const authenticated = await authenticatedWallet();
    const body = await jsonBody(request);
    const wallet = authenticated;

    const input: CreateUserInput = {
      wallet: wallet.trim(),
      username: typeof body.username === "string" ? body.username.trim() : undefined,
      avatar: typeof body.avatar === "string" ? body.avatar.trim() : undefined,
    };

    const user = await serverDb.users.upsert(input);
    return NextResponse.json({ user, ...user }, { status: 200 });
  } catch (err: unknown) {
    return apiError(err);
  }
}
