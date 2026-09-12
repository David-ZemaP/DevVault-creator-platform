import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await props.params;

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const user = await serverDb.users.getByWallet(wallet);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user, ...user }, { status: 200 });
  } catch (err: any) {
    console.error("Error in GET /api/users/[wallet]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}
