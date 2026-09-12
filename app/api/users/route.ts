import { authenticatedWallet, sameOrigin } from "@/lib/server/wallet-session";
import { apiError } from "@/lib/server/marketplace-db";
import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase/server";
import type { CreateUserInput } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const authenticated = await authenticatedWallet();
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body" },
        { status: 400 }
      );
    }

    const wallet = authenticated;

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json(
        { error: "Missing required field: wallet" },
        { status: 400 }
      );
    }

    const input: CreateUserInput = {
      wallet: wallet.trim(),
      username: typeof body.username === "string" ? body.username.trim() : undefined,
      avatar: typeof body.avatar === "string" ? body.avatar.trim() : undefined,
    };

    const user = await serverDb.users.upsert(input);
    return NextResponse.json({ user, ...user }, { status: 200 });
  } catch (err: any) {
    return apiError(err);
  }
}
