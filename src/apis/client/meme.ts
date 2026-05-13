import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorageProvider } from "@/lib/storage";
import { logAdminAction } from "./audit";
import type { Meme, MemeListData } from "@/apis/interfaces/memes";
import type { MemeTag } from "@/apis/interfaces/tags";
import type { PaginatedResult, PaginationParams } from "@/apis/interfaces/pagination";
import { applyPaginationAndSorting } from "./utils";

interface MemeTagJoin {
  tags: MemeTag | MemeTag[] | null;
}

interface MemeRow {
  id: string;
  media_key: string;
  title: string | null;
  storage_provider: string | null;
  media_type: string | null;
  ocr_content: string | null;
  access_tier: string | null;
  is_active: boolean | null;
  created_at: string;
  meme_tags?: MemeTagJoin[] | null;
}

function normalizeTagJoin(join: MemeTagJoin) {
  if (Array.isArray(join.tags)) {
    return join.tags[0] ?? null;
  }
  return join.tags;
}

function isMemeTag(tag: MemeTag | null): tag is MemeTag {
  return Boolean(tag);
}

function mapMeme(row: MemeRow): Meme {
  const provider = getStorageProvider(row.storage_provider);
  const tags = row.meme_tags?.map(normalizeTagJoin).filter(isMemeTag) ?? [];

  return {
    id: row.id,
    media_key: row.media_key,
    title: row.title,
    media_url: provider.getPublicUrl(row.media_key, row.media_type),
    storage_provider: row.storage_provider,
    media_type: row.media_type,
    ocr_content: row.ocr_content,
    access_tier: row.access_tier,
    is_active: row.is_active,
    created_at: row.created_at,
    tags,
  };
}

export interface CreateMemeInput {
  file: File;
  title?: string;
  tags: { name: string; slug: string }[];
  ocr_content?: string;
  access_tier?: string;
  is_active?: boolean;
}

export const meme = {
  async getAll(): Promise<MemeListData> {
    const supabase = await createSupabaseServerClient();
    const [{ data: memeRows, error: memesError }, { data: tagRows, error: tagsError }] =
      await Promise.all([
        supabase
          .from("memes")
          .select(
            "id, media_key, title, storage_provider, media_type, ocr_content, access_tier, is_active, created_at, meme_tags(tags(id, name, slug, category))"
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase.from("tags").select("id, name, slug, category").order("name"),
      ]);

    if (memesError) throw new Error(memesError.message);
    if (tagsError) throw new Error(tagsError.message);

    return {
      memes: ((memeRows ?? []) as MemeRow[]).map(mapMeme),
      tags: (tagRows ?? []) as MemeTag[],
    };
  },

  async list(params: PaginationParams): Promise<PaginatedResult<Meme>> {
    const supabase = await createSupabaseServerClient();
    const { page, pageSize, search } = params;

    let query = supabase
      .from("memes")
      .select(
        "id, media_key, title, storage_provider, media_type, ocr_content, access_tier, is_active, created_at, meme_tags(tags(id, name, slug, category))",
        { count: "exact" }
      )
      .eq("is_active", true);

    query = applyPaginationAndSorting(query, params, {
      defaultSortBy: "created_at",
      defaultSortOrder: "desc",
    });

    if (search?.trim()) {
      const s = search.trim();
      query = query.or(`title.ilike.%${s}%,media_key.ilike.%${s}%,ocr_content.ilike.%${s}%`);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const total = count ?? 0;
    return {
      data: ((data ?? []) as MemeRow[]).map(mapMeme),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async create(input: CreateMemeInput): Promise<string> {
    const supabase = await createSupabaseServerClient();
    const storageProvider = getStorageProvider("cloudinary");

    const upload = await storageProvider.upload({
      file: input.file,
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "meme-picker-cms",
    });

    const { data: newMeme, error: memeError } = await supabase
      .from("memes")
      .insert({
        media_key: upload.key,
        title: input.title || null,
        storage_provider: storageProvider.id,
        media_type: upload.mediaType,
        ocr_content: input.ocr_content || null,
        access_tier: input.access_tier || "free",
        is_active: input.is_active ?? true,
      })
      .select("id")
      .single();

    if (memeError || !newMeme) {
      throw new Error(memeError?.message || "Failed to save meme.");
    }

    const tagRows = await Promise.all(
      input.tags.map(async (tag) => {
        const { data, error } = await supabase
          .from("tags")
          .upsert({ name: tag.name, slug: tag.slug, category: "general" }, { onConflict: "slug" })
          .select("id")
          .single();

        if (error || !data) throw new Error(error?.message || `Failed to save tag ${tag.name}.`);
        return data;
      })
    );

    const { error: joinError } = await supabase.from("meme_tags").insert(
      tagRows.map((tag) => ({
        meme_id: newMeme.id,
        tag_id: tag.id,
      }))
    );

    if (joinError) throw new Error(joinError.message);

    await logAdminAction({
      action: "meme.create",
      entityType: "meme",
      entityId: newMeme.id,
      metadata: {
        media_key: upload.key,
        media_type: upload.mediaType,
        tag_ids: tagRows.map((tag) => tag.id),
        tag_slugs: input.tags.map((tag) => tag.slug),
      },
    });

    return newMeme.id;
  },

  async update(id: string, input: Omit<CreateMemeInput, "file">): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { data: updatedMeme, error: memeError } = await supabase
      .from("memes")
      .update({
        title: input.title || null,
        ocr_content: input.ocr_content || null,
        access_tier: input.access_tier || "free",
        is_active: input.is_active ?? true,
      })
      .eq("id", id)
      .select("id, media_key, title")
      .single();

    if (memeError || !updatedMeme) {
      throw new Error(memeError?.message || "Failed to update meme.");
    }

    // Update tags: Delete existing joins and recreate
    await supabase.from("meme_tags").delete().eq("meme_id", id);

    const tagRows = await Promise.all(
      input.tags.map(async (tag) => {
        const { data, error } = await supabase
          .from("tags")
          .upsert({ name: tag.name, slug: tag.slug, category: "general" }, { onConflict: "slug" })
          .select("id")
          .single();

        if (error || !data) throw new Error(error?.message || `Failed to save tag ${tag.name}.`);
        return data;
      })
    );

    const { error: joinError } = await supabase.from("meme_tags").insert(
      tagRows.map((tag) => ({
        meme_id: id,
        tag_id: tag.id,
      }))
    );

    if (joinError) throw new Error(joinError.message);

    await logAdminAction({
      action: "meme.update",
      entityType: "meme",
      entityId: id,
      metadata: {
        media_key: updatedMeme.media_key,
        title: updatedMeme.title,
        tag_ids: tagRows.map((tag) => tag.id),
      },
    });
  },

  async delete(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("memes")
      .update({ is_active: false })
      .eq("id", id)
      .select("id, media_key")
      .single();

    if (error || !data) throw new Error(error?.message || "Failed to delete meme.");

    await logAdminAction({
      action: "meme.delete",
      entityType: "meme",
      entityId: data.id,
      metadata: { media_key: data.media_key, is_active: false },
    });
  },
};
