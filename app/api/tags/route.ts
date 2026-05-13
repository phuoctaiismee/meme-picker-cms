import { NextResponse } from "next/server";
import { getAdminDatabaseErrorMessage, logAdminAction } from "@/lib/memes/audit";
import { getTagManagementData } from "@/lib/memes/data";
import { slugifyTag } from "@/lib/memes/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const query = searchParams.get("q")?.trim();

  if (mode === "management") {
    try {
      return NextResponse.json(await getTagManagementData());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load tags.";

      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

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

function getTagFields(input: unknown) {
  const body = input as { name?: unknown; category?: unknown };
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim() || null;
  const slug = slugifyTag(name);

  if (!name || !slug) {
    throw new Error("Tag name is required.");
  }

  return { name, category, slug };
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const tag = getTagFields(await request.json());

    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tag.slug)
      .maybeSingle();

    if (existing) {
      throw new Error("A tag with this slug already exists.");
    }

    const { data, error } = await supabase
      .from("tags")
      .insert(tag)
      .select("id, name, slug, category")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create tag.");
    }

    await logAdminAction({
      action: "tag.create",
      entityType: "tag",
      entityId: data.id,
      metadata: data,
    });

    return NextResponse.json({ tag: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create tag.";

    return NextResponse.json(
      { error: getAdminDatabaseErrorMessage(message) },
      { status: 400 }
    );
  }
}
