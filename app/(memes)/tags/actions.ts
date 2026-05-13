"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminDatabaseErrorMessage, logAdminAction } from "@/lib/memes/audit";
import { slugifyTag } from "@/lib/memes/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getTagFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const slug = slugifyTag(name);

  if (!name || !slug) {
    throw new Error("Tag name is required.");
  }

  return { name, category, slug };
}

function redirectWithError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "Failed to manage tag.";

  redirect(`/tags?error=${encodeURIComponent(getAdminDatabaseErrorMessage(message))}`);
}

export async function createTag(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const tag = getTagFields(formData);

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
  } catch (error) {
    redirectWithError(error);
  }

  revalidatePath("/tags");
}

export async function updateTag(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const id = Number(formData.get("id"));
    const tag = getTagFields(formData);

    if (!Number.isInteger(id)) {
      throw new Error("Tag id is required.");
    }

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
  } catch (error) {
    redirectWithError(error);
  }

  revalidatePath("/tags");
  revalidatePath("/");
}

export async function deleteTag(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient();
    const id = Number(formData.get("id"));

    if (!Number.isInteger(id)) {
      throw new Error("Tag id is required.");
    }

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
  } catch (error) {
    redirectWithError(error);
  }

  revalidatePath("/tags");
  revalidatePath("/");
}
