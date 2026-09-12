import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase/server";
import type { CreatePublicationInput } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorWallet = searchParams.get("creatorWallet") || undefined;

    const publications = await serverDb.publications.list(creatorWallet);
    return NextResponse.json({ publications }, { status: 200 });
  } catch (err: any) {
    console.error("Error in GET /api/publications:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch publications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body" },
        { status: 400 }
      );
    }

    const { creatorWallet, title, preview, contentHash } = body;

    // Validate required fields per architectural specification
    if (!creatorWallet || typeof creatorWallet !== "string") {
      return NextResponse.json(
        { error: "Missing required field: creatorWallet" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Missing required field: title" },
        { status: 400 }
      );
    }

    if (!preview || typeof preview !== "string") {
      return NextResponse.json(
        { error: "Missing required field: preview" },
        { status: 400 }
      );
    }

    if (!contentHash || typeof contentHash !== "string") {
      return NextResponse.json(
        { error: "Missing required field: contentHash" },
        { status: 400 }
      );
    }

    const input: CreatePublicationInput = {
      id: typeof body.id === "string" ? body.id : undefined,
      creatorWallet: body.creatorWallet.trim(),
      title: body.title.trim(),
      description: typeof body.description === "string" ? body.description.trim() : undefined,
      preview: body.preview.trim(),
      premiumContent: typeof body.premiumContent === "string" ? body.premiumContent : undefined,
      contentHash: body.contentHash.trim(),
      lockAddress: typeof body.lockAddress === "string" ? body.lockAddress.trim() : undefined,
      proofId: typeof body.proofId === "string" ? body.proofId.trim() : undefined,
      avalancheTx: typeof body.avalancheTx === "string" ? body.avalancheTx.trim() : undefined,
      version: typeof body.version === "number" ? body.version : undefined,
    };

    const publication = await serverDb.publications.create(input);
    return NextResponse.json({ publication, ...publication }, { status: 201 });
  } catch (err: any) {
    console.error("Error in POST /api/publications:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create publication" },
      { status: 500 }
    );
  }
}
