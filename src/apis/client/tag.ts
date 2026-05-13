import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "./audit";
import { slugifyTag } from "@/lib/slug";
import type { MemeTag, TagManagementData, ManagedTag } from "@/apis/interfaces/tags";
import type { PaginatedResult, PaginationParams } from "@/apis/interfaces/pagination";
import { applyPaginationAndSorting } from "./utils";

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

  async list(params: PaginationParams): Promise<PaginatedResult<ManagedTag>> {
    const supabase = await createSupabaseServerClient();
    const { page, pageSize, search } = params;

    let query = supabase
      .from("tags")
      .select("id, name, slug, category", { count: "exact" });

    query = applyPaginationAndSorting(query, params, {
      defaultSortBy: "name",
      defaultSortOrder: "asc",
    });

    if (search?.trim()) {
      const s = search.trim();
      query = query.or(`name.ilike.%${s}%,slug.ilike.%${s}%,category.ilike.%${s}%`);
    }

    const { data: tagRows, error: tagsError, count } = await query;
    if (tagsError) throw new Error(tagsError.message);

    // Fetch usage counts for this page of tags only
    const tagIds = (tagRows ?? []).map((t: any) => t.id);
    const { data: joinRows, error: joinsError } = tagIds.length
      ? await supabase
          .from("meme_tags")
          .select("tag_id, memes!inner(id)")
          .in("tag_id", tagIds)
          .eq("memes.is_active", true)
      : { data: [], error: null };

    if (joinsError) throw new Error(joinsError.message);

    const usageCounts = new Map<number, number>();
    for (const join of (joinRows ?? []) as { tag_id: number }[]) {
      usageCounts.set(join.tag_id, (usageCounts.get(join.tag_id) ?? 0) + 1);
    }

    const total = count ?? 0;
    return {
      data: ((tagRows ?? []) as MemeTag[]).map((t) => ({
        ...t,
        usage_count: usageCounts.get(t.id) ?? 0,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
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
