import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    if (!id) {
      return NextResponse.json(
        { error: "Publication ID is required" },
        { status: 400 }
      );
    }

    const publication = await serverDb.publications.getById(id);

    if (!publication) {
      return NextResponse.json(
        { error: "Publication not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ publication, ...publication }, { status: 200 });
  } catch (err: any) {
    console.error("Error in GET /api/publications/[id]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch publication" },
      { status: 500 }
    );
  }
}
