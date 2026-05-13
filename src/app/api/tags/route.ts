import { NextResponse } from "next/server";
import { appClient } from "@/apis/client";
import { getAdminDatabaseErrorMessage } from "@/apis/client/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const query = searchParams.get("q")?.trim();

  if (mode === "management") {
    try {
      return NextResponse.json(await appClient.tag.getAll());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load tags.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Auto-complete simple list
  const supabase = await createSupabaseServerClient();
  let builder = supabase
    .from("tags")
    .select("id, name, slug, category")
    .order("name")
    .limit(20);

  if (query) {
    const safeQuery = query.replace(/[%(),]/g, "");
    builder = builder.or(`name.ilike.%${safeQuery}%,slug.ilike.%${safeQuery}%`);
  }

  const { data, error } = await builder;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tags: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const category = String(body.category ?? "").trim() || null;

    const id = await appClient.tag.create({ name, category });
    return NextResponse.json({ tag: { id, name, category } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create tag.";
    return NextResponse.json(
      { error: getAdminDatabaseErrorMessage(message) },
      { status: 400 }
    );
  }
}
