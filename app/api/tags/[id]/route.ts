import { NextResponse } from "next/server";
import { getAdminDatabaseErrorMessage, logAdminAction } from "@/lib/memes/audit";
import { slugifyTag } from "@/lib/memes/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
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

function getTagId(value: string) {
  const id = Number(value);

  if (!Number.isInteger(id)) {
    throw new Error("Tag id is required.");
  }

  return id;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id: rawId } = await context.params;
    const id = getTagId(rawId);
    const tag = getTagFields(await request.json());

    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tag.slug)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      throw new Error("A tag with this slug already exists.");
    }

    const { data, error } = await supabase
      .from("tags")
      .update(tag)
      .eq("id", id)
      .select("id, name, slug, category")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update tag.");
    }

    await logAdminAction({
      action: "tag.update",
      entityType: "tag",
      entityId: data.id,
      metadata: data,
    });

    return NextResponse.json({ tag: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update tag.";

    return NextResponse.json(
      { error: getAdminDatabaseErrorMessage(message) },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id: rawId } = await context.params;
    const id = getTagId(rawId);

    const { count, error: countError } = await supabase
      .from("meme_tags")
      .select("tag_id", { count: "exact", head: true })
      .eq("tag_id", id);

    if (countError) {
      throw new Error(countError.message);
    }

    if ((count ?? 0) > 0) {
      throw new Error("Tags attached to memes cannot be deleted.");
    }

    const { data, error } = await supabase
      .from("tags")
      .delete()
      .eq("id", id)
      .select("id, name, slug, category")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to delete tag.");
    }

    await logAdminAction({
      action: "tag.delete",
      entityType: "tag",
      entityId: data.id,
      metadata: data,
    });

    return NextResponse.json({ tag: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete tag.";

    return NextResponse.json(
      { error: getAdminDatabaseErrorMessage(message) },
      { status: 400 }
    );
  }
}
