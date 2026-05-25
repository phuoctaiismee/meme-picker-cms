import { NextResponse } from "next/server";
import { appClient } from "@/apis/client";
import { getAdminDatabaseErrorMessage } from "@/apis/client/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePaginationParams } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const query = searchParams.get("q")?.trim();

  if (mode === "management") {
    const category = searchParams.get("category")?.trim() || undefined;
    const params = { ...parsePaginationParams(request.url), category };
    try {
      return NextResponse.json(await appClient.tag.list(params));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load tags.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Auto-complete simple list (for tag search in create-meme-form)
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
    const category = String(body.category ?? "").trim() || null;

    if (Array.isArray(body.names)) {
      const results = [];
      const errors = [];
      for (const name of body.names) {
        const cleanName = String(name ?? "").trim();
        if (cleanName) {
          try {
            const id = await appClient.tag.create({ name: cleanName, category });
            results.push({ id, name: cleanName, category });
          } catch (error: any) {
            errors.push({ name: cleanName, error: error.message });
          }
        }
      }
      
      if (results.length === 0 && errors.length > 0) {
        throw new Error(errors[0].error || "Failed to create tags.");
      }
      
      return NextResponse.json({ tags: results, errors });
    }

    const name = String(body.name ?? "").trim();
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

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const ids = body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Tag ids are required." }, { status: 400 });
    }
    const numericIds = ids.map(Number).filter((id) => !isNaN(id));
    await appClient.tag.deleteBulk(numericIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to bulk delete tags.";
    return NextResponse.json(
      { error: getAdminDatabaseErrorMessage(message) },
      { status: 400 }
    );
  }
}
