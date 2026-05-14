import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorageProvider } from "@/lib/storage";
import { logAdminAction } from "./audit";
import type { Meme, MemeListData } from "@/apis/interfaces/memes";
import type { MemeTag } from "@/apis/interfaces/tags";
import type { PaginatedResult, PaginationParams } from "@/apis/interfaces/pagination";
import { applyPaginationAndSorting } from "./utils";
import { cache } from "@/lib/cache";

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
      );

    if (params.status === "active" || !params.status) {
      query = query.eq("is_active", true);
    } else if (params.status === "inactive") {
      query = query.eq("is_active", false);
    }

    if (params.tags?.trim()) {
      const tagSlugs = params.tags.split(",").map((s) => s.trim()).filter(Boolean);
      if (tagSlugs.length > 0) {
        const { data: tagRows } = await supabase
          .from("tags")
          .select("id")
          .in("slug", tagSlugs);

        if (tagRows && tagRows.length > 0) {
          const tagIds = tagRows.map((t) => t.id);
          const { data: memeTagRows } = await supabase
            .from("meme_tags")
            .select("meme_id")
            .in("tag_id", tagIds);

          if (memeTagRows && memeTagRows.length > 0) {
            const memeIds = Array.from(new Set(memeTagRows.map((mt) => mt.meme_id)));
            query = query.in("id", memeIds);
          } else {
            return { data: [], total: 0, page, pageSize, pageCount: 1 };
          }
        } else {
          return { data: [], total: 0, page, pageSize, pageCount: 1 };
        }
      }
    }

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

  async update(id: string, input: Partial<Omit<CreateMemeInput, "file">>): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title || null;
    if (input.ocr_content !== undefined) updateData.ocr_content = input.ocr_content || null;
    if (input.access_tier !== undefined) updateData.access_tier = input.access_tier || "free";
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { data: updatedMeme, error: memeError } = await supabase
      .from("memes")
      .update(updateData)
      .eq("id", id)
      .select("id, media_key, title")
      .single();

    if (memeError || !updatedMeme) {
      throw new Error(memeError?.message || "Failed to update meme.");
    }

    if (input.tags) {
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
    }

    await logAdminAction({
      action: "meme.update",
      entityType: "meme",
      entityId: id,
      metadata: {
        media_key: updatedMeme.media_key,
        title: updatedMeme.title,
        ...(input.tags ? { tag_count: input.tags.length } : {}),
      },
    });
  },

  async delete(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // Fetch the meme first to check its status
    const { data: meme, error: fetchError } = await supabase
      .from("memes")
      .select("id, media_key, storage_provider, media_type, is_active, title")
      .eq("id", id)
      .single();

    if (fetchError || !meme) {
      throw new Error(fetchError?.message || "Meme not found.");
    }

    if (meme.is_active) {
      // Soft delete: Deactivate
      const { error } = await supabase
        .from("memes")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw new Error(error.message);

      await logAdminAction({
        action: "meme.deactivate",
        entityType: "meme",
        entityId: id,
        metadata: {
          media_key: meme.media_key,
          title: meme.title,
        },
      });
    } else {
      // Hard delete: Remove from DB and Storage
      
      // 1. Delete file from storage
      const storage = getStorageProvider(meme.storage_provider);
      try {
        await storage.delete(meme.media_key, meme.media_type);
      } catch (storageError) {
        console.error("Failed to delete file from storage:", storageError);
        // We continue even if storage delete fails to clean up the database
      }

      // 2. Delete from database (Cascade will handle meme_tags and interactions)
      const { error: dbError } = await supabase
        .from("memes")
        .delete()
        .eq("id", id);

      if (dbError) throw new Error(dbError.message);

      await logAdminAction({
        action: "meme.delete_permanent",
        entityType: "meme",
        entityId: id,
        metadata: {
          media_key: meme.media_key,
          title: meme.title,
        },
      });
    }
  },

  async suggest(context: string, limit: number = 5): Promise<Meme[]> {
    const normalizedContext = context.trim();
    if (!normalizedContext) return [];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[suggest] GEMINI_API_KEY is not set.");
      return [];
    }

    const supabase = await createSupabaseServerClient();
    const genAI = new GoogleGenerativeAI(apiKey);

    // 1. Semantic Cache Check (using interactions table)
    try {
      console.log("[suggest] Checking semantic cache in interactions...");
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
      const embeddingResult = await embeddingModel.embedContent({
        content: { role: "user", parts: [{ text: normalizedContext }] },
        taskType: "RETRIEVAL_QUERY" as any,
        outputDimensionality: 768,
      } as any);
      const queryVector = embeddingResult.embedding.values;

      const { data: matches, error: rpcError } = await supabase.rpc("match_past_suggestions", {
        query_embedding: queryVector,
        match_threshold: 0.1, // Set very low for debugging
        match_count: 1
      });

      if (rpcError) {
        console.error("[suggest] RPC Error during cache check:", rpcError.message, rpcError.details);
      }

      console.log(`[suggest] Cache search results: ${matches?.length || 0} matches found.`);

      if (!rpcError && matches && matches.length > 0) {
        const bestMatch = matches[0];
        console.log(`[suggest] Semantic cache hit from interactions! Similarity: ${bestMatch.similarity.toFixed(4)}`);
        
        const metadata = bestMatch.context_metadata as any;
        const cachedMemeIds = metadata?.suggested_meme_ids as string[];

        if (cachedMemeIds && cachedMemeIds.length > 0) {
          const { data: memes } = await supabase
            .from("memes")
            .select("id, media_key, title, storage_provider, media_type, ocr_content, access_tier, is_active, created_at, meme_tags(tags(id, name, slug, category))")
            .in("id", cachedMemeIds)
            .eq("is_active", true);

          if (memes && memes.length > 0) {
            return (memes as any[]).map(mapMeme);
          }
        }
      }
    } catch (err) {
      console.error("[suggest] Semantic cache error:", err);
    }

    // 2. Fetch all available tags
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select("name, slug");

    if (tagsError || !tags) return [];
    const tagList = tags.map(t => `${t.name} (${t.slug})`).join(", ");

    // 3. Use Gemini Flash for new suggestions
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        You are a meme suggestion assistant.
        A user is viewing a social media post with the following content:
        "${context}"

        Based on this context, select up to 3 most relevant meme tags from the following list:
        ${tagList}

        If no tags are relevant, return an empty string.
        Output ONLY the slugs of the tags separated by commas. Do not include any other text or explanation.
      `;

      console.log("[suggest] Calling Gemini Flash for new suggestions...");
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      const suggestedSlugs = responseText
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      if (suggestedSlugs.length === 0) return [];

      // 4. Query memes based on suggested tags
      const { data: tagRows } = await supabase.from("tags").select("id").in("slug", suggestedSlugs);
      if (!tagRows || tagRows.length === 0) return [];

      const tagIds = tagRows.map(t => t.id);
      const { data: memeTagRows } = await supabase.from("meme_tags").select("meme_id").in("tag_id", tagIds);
      if (!memeTagRows || memeTagRows.length === 0) return [];

      const memeIds = Array.from(new Set(memeTagRows.map(mt => mt.meme_id))).slice(0, limit);
      const { data: memes } = await supabase
        .from("memes")
        .select("id, media_key, title, storage_provider, media_type, ocr_content, access_tier, is_active, created_at, meme_tags(tags(id, name, slug, category))")
        .in("id", memeIds)
        .eq("is_active", true);

      if (!memes) return [];

      // 5. Save to interactions as Semantic Cache
      try {
        const finalMemeIds = memes.map(m => m.id);
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
        const embeddingResult = await embeddingModel.embedContent({
          content: { role: "user", parts: [{ text: normalizedContext }] },
          taskType: "RETRIEVAL_QUERY" as any,
          outputDimensionality: 768,
        } as any);
        const vector = embeddingResult.embedding.values;

        console.log(`[suggest] Attempting to save to DB. Vector length: ${vector.length}`);

        const { error: insertError } = await supabase.from("interactions").insert({
          action_type: "ai_suggestion",
          context_metadata: {
            context_text: normalizedContext,
            suggested_meme_ids: finalMemeIds
          },
          embedding: vector
        });

        if (insertError) {
          console.error("[suggest] Supabase insert error:", insertError.message, insertError.details);
        } else {
          console.log("[suggest] Successfully saved to interactions (semantic cache).");
        }
      } catch (saveErr) {
        console.error("[suggest] Unexpected error during save:", saveErr);
      }

      return (memes as any[]).map(mapMeme);
    } catch (error) {
      console.error("[suggest] AI error:", error);
      return [];
    }
  },
};
