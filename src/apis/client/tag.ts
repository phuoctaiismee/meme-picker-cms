import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "./audit";
import { slugifyTag } from "@/lib/slug";
import type { MemeTag, TagManagementData } from "@/apis/interfaces/tags";

export interface CreateTagInput {
  name: string;
  category?: string | null;
}

export interface UpdateTagInput {
  id: number;
  name: string;
  category?: string | null;
}

export const tag = {
  async getAll(): Promise<TagManagementData> {
    const supabase = await createSupabaseServerClient();

    const [{ data: tagRows, error: tagsError }, { data: joinRows, error: joinsError }] =
      await Promise.all([
        supabase.from("tags").select("id, name, slug, category").order("name"),
        supabase.from("meme_tags").select("tag_id, memes!inner(id)").eq("memes.is_active", true),
      ]);

    if (tagsError) throw new Error(tagsError.message);
    if (joinsError) throw new Error(joinsError.message);

    const usageCounts = new Map<number, number>();

    for (const join of (joinRows ?? []) as { tag_id: number }[]) {
      usageCounts.set(join.tag_id, (usageCounts.get(join.tag_id) ?? 0) + 1);
    }

    return {
      tags: ((tagRows ?? []) as MemeTag[]).map((t) => ({
        ...t,
        usage_count: usageCounts.get(t.id) ?? 0,
      })),
    };
  },

  async create(input: CreateTagInput): Promise<number> {
    const supabase = await createSupabaseServerClient();
    const slug = slugifyTag(input.name);

    if (!input.name || !slug) throw new Error("Tag name is required.");

    const { data: existing } = await supabase.from("tags").select("id").eq("slug", slug).maybeSingle();
    if (existing) throw new Error("A tag with this slug already exists.");

    const { data, error } = await supabase
      .from("tags")
      .insert({ name: input.name, slug, category: input.category || null })
      .select("id, name, slug, category")
      .single();

    if (error || !data) throw new Error(error?.message || "Failed to create tag.");

    await logAdminAction({
      action: "tag.create",
      entityType: "tag",
      entityId: data.id,
      metadata: data,
    });

    return data.id;
  },

  async update(input: UpdateTagInput): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const slug = slugifyTag(input.name);

    if (!input.name || !slug) throw new Error("Tag name is required.");

    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .neq("id", input.id)
      .maybeSingle();

    if (existing) throw new Error("A tag with this slug already exists.");

    const { data, error } = await supabase
      .from("tags")
      .update({ name: input.name, slug, category: input.category || null })
      .eq("id", input.id)
      .select("id, name, slug, category")
      .single();

    if (error || !data) throw new Error(error?.message || "Failed to update tag.");

    await logAdminAction({
      action: "tag.update",
      entityType: "tag",
      entityId: data.id,
      metadata: data,
    });
  },

  async delete(id: number): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { data: usageData, error: countError } = await supabase
      .from("meme_tags")
      .select("tag_id, memes!inner(id)")
      .eq("tag_id", id)
      .eq("memes.is_active", true)
      .limit(1);

    if (countError) throw new Error(countError.message);
    if (usageData && usageData.length > 0) {
      throw new Error("Tags attached to active memes cannot be deleted.");
    }

    const { data, error } = await supabase
      .from("tags")
      .delete()
      .eq("id", id)
      .select("id, name, slug, category")
      .single();

    if (error || !data) throw new Error(error?.message || "Failed to delete tag.");

    await logAdminAction({
      action: "tag.delete",
      entityType: "tag",
      entityId: data.id,
      metadata: data,
    });
  },
};
