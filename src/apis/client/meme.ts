import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorageProvider } from "@/lib/storage";
import { logAdminAction } from "./audit";
import type { Meme, MemeListData } from "@/apis/interfaces/memes";
import type { MemeTag } from "@/apis/interfaces/tags";
import type { PaginatedResult, PaginationParams } from "@/apis/interfaces/pagination";
import { applyPaginationAndSorting, getGTEEmbedding } from "./utils";
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

async function ensureMediaCleanup(supabase: any, mediaKey: string, mediaType: string | null, storageProvider: string | null, currentMemeId: string) {
  // Check if any other meme is using this media_key
  const { count, error } = await supabase
    .from("memes")
    .select("id", { count: "exact", head: true })
    .eq("media_key", mediaKey)
    .neq("id", currentMemeId);

  if (!error && (count === 0 || count === null)) {
    const storage = getStorageProvider(storageProvider);
    await storage.delete(mediaKey, mediaType).catch(console.error);
  }
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
    const { page, pageSize, search, status, tags: tagsParam, sortBy, sortOrder } = params;
    const cacheKey = `memes:list:${JSON.stringify({ page, pageSize, search, status, tagsParam, sortBy, sortOrder })}`;
    
    // Try to get from cache first
    const cached = await cache.get<PaginatedResult<Meme>>(cacheKey);
    if (cached) {
      console.log(`[Meme API] Cache hit for key: ${cacheKey}`);
      return cached;
    }

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("memes")
      .select(
        "id, media_key, title, storage_provider, media_type, ocr_content, access_tier, is_active, created_at, meme_tags(tags(id, name, slug, category))",
        { count: "exact" }
      );

    if (status === "active" || !status) {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }

    if (tagsParam?.trim()) {
      const tagSlugs = tagsParam.split(",").map((s) => s.trim()).filter(Boolean);
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
            const result = { data: [], total: 0, page, pageSize, pageCount: 1 };
            await cache.set(cacheKey, result, 300); // Cache empty results too
            return result;
          }
        } else {
          const result = { data: [], total: 0, page, pageSize, pageCount: 1 };
          await cache.set(cacheKey, result, 300);
          return result;
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
    const result = {
      data: ((data ?? []) as MemeRow[]).map(mapMeme),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };

    // Store in cache for 5 minutes
    await cache.set(cacheKey, result, 300);
    return result;
  },

  async create(input: CreateMemeInput): Promise<{ id: string; embeddingGenerated: boolean }> {
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

    // --- NEW: Generate Embedding for the meme using GTE ---
    let embeddingGenerated = false;
    try {
      const tagsString = input.tags.map(t => t.name).join(", ");
      const textToEmbed = `${input.title || ""} ${input.ocr_content || ""} ${tagsString}`.trim();
      
      if (textToEmbed) {
        const vector = await getGTEEmbedding(textToEmbed);
        
        const { error: updateError } = await supabase
          .from("memes")
          .update({ embedding: vector })
          .eq("id", newMeme.id);
        
        if (updateError) {
          console.error("[create] Update GTE embedding error:", updateError.message);
        } else {
          console.log(`[create] Successfully updated GTE embedding for meme: ${newMeme.id}`);
          embeddingGenerated = true;
        }
      }
    } catch (err) {
      console.error("[create] Failed to generate GTE embedding:", err);
    }
    // -------------------------------------------

    const tagRows = await Promise.all(
      input.tags.map(async (tag) => {
        let embedding: number[] | null = null;
        try {
          embedding = await getGTEEmbedding(tag.name);
        } catch (err) {
          console.error(`[create.upsertTag] Failed to generate GTE embedding for ${tag.name}:`, err);
        }

        const { data, error } = await supabase
          .from("tags")
          .upsert({ name: tag.name, slug: tag.slug, category: "general", embedding }, { onConflict: "slug" })
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

    // Invalidate cache
    await cache.invalidate("memes:list");

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

    return { id: newMeme.id, embeddingGenerated };
  },

  async update(id: string, input: Partial<CreateMemeInput> & { media_key?: string; media_url?: string }): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const storage = getStorageProvider();

    // 1. Fetch current meme to check for old media
    const { data: currentMeme, error: fetchError } = await supabase
      .from("memes")
      .select("media_key, media_type, storage_provider, title, ocr_content")
      .eq("id", id)
      .single();

    if (fetchError || !currentMeme) {
      throw new Error(fetchError?.message || "Meme not found.");
    }

    const updateData: any = {};
    
    if (input.file) {
      // Option A: Upload new file
      const upload = await storage.upload({ file: input.file });
      updateData.media_key = upload.key;
      updateData.media_type = upload.mediaType;

      // Cleanup old file ONLY IF no other meme uses it
      ensureMediaCleanup(supabase, currentMeme.media_key, currentMeme.media_type, currentMeme.storage_provider, id).catch(console.error);
    } else if (input.media_key) {
      // Option B: Choose existing media from gallery
      updateData.media_key = input.media_key;
      updateData.media_type = "image"; // We are only supporting images for gallery for now
    }

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
          let embedding: number[] | null = null;
          try {
            embedding = await getGTEEmbedding(tag.name);
          } catch (err) {
            console.error(`[update.upsertTag] Failed to generate GTE embedding for ${tag.name}:`, err);
          }

          const { data, error } = await supabase
            .from("tags")
            .upsert({ name: tag.name, slug: tag.slug, category: "general", embedding }, { onConflict: "slug" })
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

    // Re-generate GTE embedding on update if any relevant content changed
    if (input.title !== undefined || input.ocr_content !== undefined || input.tags !== undefined) {
      try {
        const finalTitle = input.title !== undefined ? input.title : (currentMeme.title || "");
        const finalOcr = input.ocr_content !== undefined ? input.ocr_content : (currentMeme.ocr_content || "");
        
        let tagsString = "";
        if (input.tags) {
          tagsString = input.tags.map(t => t.name).join(", ");
        } else {
          const { data: currentTags } = await supabase
            .from("meme_tags")
            .select("tags(name)")
            .eq("meme_id", id);
          if (currentTags) {
            tagsString = currentTags.map((t: any) => t.tags?.name).filter(Boolean).join(", ");
          }
        }
        
        const textToEmbed = `${finalTitle || ""} ${finalOcr || ""} ${tagsString}`.trim();
        if (textToEmbed) {
          const vector = await getGTEEmbedding(textToEmbed);
          await supabase
            .from("memes")
            .update({ embedding: vector })
            .eq("id", id);
          console.log(`[update] Successfully re-generated GTE embedding for meme: ${id}`);
        }
      } catch (err) {
        console.error("[update] Failed to re-generate GTE embedding:", err);
      }
    }

    // Invalidate cache
    await cache.invalidate("memes:list");

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
      
      // 1. Delete file from storage ONLY IF no other meme uses it
      try {
        await ensureMediaCleanup(supabase, meme.media_key, meme.media_type, meme.storage_provider, id);
      } catch (storageError) {
        console.error("Failed to delete file from storage:", storageError);
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

    // Invalidate cache
    await cache.invalidate("memes:list");
  },

  async deleteBulk(ids: string[]): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { data: memes, error: fetchError } = await supabase
      .from("memes")
      .select("id, media_key, storage_provider, media_type, is_active, title")
      .in("id", ids);

    if (fetchError || !memes) {
      throw new Error(fetchError?.message || "Failed to fetch memes for deletion.");
    }

    const activeIds = memes.filter(m => m.is_active).map(m => m.id);
    const inactiveMemes = memes.filter(m => !m.is_active);

    if (activeIds.length > 0) {
      const { error: deactivateError } = await supabase
        .from("memes")
        .update({ is_active: false })
        .in("id", activeIds);
      
      if (deactivateError) throw new Error(deactivateError.message);
      
      for (const m of memes.filter(m => m.is_active)) {
        await logAdminAction({
          action: "meme.deactivate",
          entityType: "meme",
          entityId: m.id,
          metadata: { media_key: m.media_key, title: m.title },
        });
      }
    }

    if (inactiveMemes.length > 0) {
      const inactiveIds = inactiveMemes.map(m => m.id);
      
      for (const m of inactiveMemes) {
        const storage = getStorageProvider(m.storage_provider);
        try {
          await storage.delete(m.media_key, m.media_type);
        } catch (storageError) {
          console.error(`Failed to delete file from storage for ${m.id}:`, storageError);
        }
      }

      const { error: dbError } = await supabase
        .from("memes")
        .delete()
        .in("id", inactiveIds);

      if (dbError) throw new Error(dbError.message);

      for (const m of inactiveMemes) {
        await logAdminAction({
          action: "meme.delete_permanent",
          entityType: "meme",
          entityId: m.id,
          metadata: { media_key: m.media_key, title: m.title },
        });
      }
    }

    // Invalidate cache
    await cache.invalidate("memes:list");
  },

  async suggest(context: string, limit: number = 5): Promise<Meme[]> {
    const normalizedContext = context.trim().toLowerCase();
    if (!normalizedContext) return [];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[suggest] GEMINI_API_KEY is not set.");
      return [];
    }

    const supabase = await createSupabaseServerClient();

    // 0. Exact Match Check (Fastest & Free)
    try {
      const originalContext = context.trim();
      const { data: exactMatches } = await supabase
        .from("interactions")
        .select("context_metadata")
        .eq("action_type", "ai_suggestion")
        .in("context_metadata->>context_text", [originalContext, normalizedContext])
        .order("created_at", { ascending: false })
        .limit(1);

      if (exactMatches && exactMatches.length > 0) {
        const metadata = exactMatches[0].context_metadata as any;
        const cachedMemeIds = metadata?.suggested_meme_ids as string[];

        if (cachedMemeIds && cachedMemeIds.length > 0) {
          console.log(`[suggest] Exact match hit for "${normalizedContext}"!`);
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
      console.error("[suggest] Exact match check error:", err);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let queryVector: number[] = [];

    // 1. Generate GTE query embedding
    try {
      console.log("[suggest] Embedding query with GTE model server...");
      queryVector = await getGTEEmbedding(`Query: ${normalizedContext}`);
    } catch (err) {
      console.error("[suggest] Failed to generate GTE query embedding:", err);
    }

    // 2. Semantic Cache Check (using interactions table and queryVector)
    if (queryVector.length > 0) {
      try {
        console.log("[suggest] Checking semantic cache in interactions...");
        const { data: matches, error: rpcError } = await supabase.rpc("match_past_suggestions", {
          query_embedding: queryVector,
          match_threshold: 0.82, // Tăng lên 0.82 để tránh false positive cho các ngữ cảnh khác nhau
          match_count: 1
        });

        if (rpcError) {
          console.error("[suggest] RPC Error during cache check:", rpcError.message, rpcError.details);
        }

        console.log(`[suggest] Cache search results: ${matches?.length || 0} matches found above threshold.`);

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
    }

    // 3. Direct Vector Search on Memes
    if (queryVector.length > 0) {
      try {
        console.log("[suggest] Running direct vector search on memes...");
        const { data: directMatches, error: directSearchError } = await supabase.rpc("match_memes", {
          query_embedding: queryVector,
          match_threshold: 0.72, // Cosine similarity threshold
          match_count: limit
        });

        if (directSearchError) {
          console.error("[suggest] Direct match_memes RPC failed:", directSearchError.message);
        } else if (directMatches && directMatches.length > 0) {
          console.log(`[suggest] Direct vector search hit! Found ${directMatches.length} matching memes.`);
          
          const matchingIds = directMatches.map((m: any) => m.id);
          const { data: memesWithTags } = await supabase
            .from("memes")
            .select("id, media_key, title, storage_provider, media_type, ocr_content, access_tier, is_active, created_at, meme_tags(tags(id, name, slug, category))")
            .in("id", matchingIds)
            .eq("is_active", true);

          if (memesWithTags && memesWithTags.length > 0) {
            const mapped = (memesWithTags as any[]).map(mapMeme);
            
            // Sort mapped list to preserve the similarity rank from RPC
            mapped.sort((a, b) => {
              const indexA = matchingIds.indexOf(a.id);
              const indexB = matchingIds.indexOf(b.id);
              return indexA - indexB;
            });

            // Save suggestion to cache asynchronously
            try {
              await supabase.from("interactions").insert({
                action_type: "ai_suggestion",
                context_metadata: {
                  context_text: normalizedContext,
                  suggested_meme_ids: matchingIds
                },
                embedding: queryVector
              });
              console.log("[suggest] Saved GTE direct search result to cache.");
            } catch (saveErr) {
              console.error("[suggest] Failed to cache GTE direct match:", saveErr);
            }

            return mapped;
          }
        }
      } catch (err) {
        console.error("[suggest] Direct vector search error:", err);
      }
    }

    // 4. Fallback: Semantic Tag Matching via GTE (100% Free & No Gemini tokens)
    console.log("[suggest] Direct search missed. Falling back to GTE Semantic Tag Matching...");
    try {
      if (queryVector.length === 0) {
        console.warn("[suggest] GTE queryVector is empty. Skipping fallback.");
        return [];
      }

      // Call the match_tags RPC to find the top 3 semantically related tags
      const { data: matchedTags, error: tagMatchError } = await supabase.rpc("match_tags", {
        query_embedding: queryVector,
        match_threshold: 0.35, // Slightly lower threshold since tag titles are short
        match_count: 3
      });

      if (tagMatchError) {
        console.error("[suggest] match_tags RPC failed:", tagMatchError.message);
        return [];
      }

      if (!matchedTags || matchedTags.length === 0) {
        console.log("[suggest] No semantically matching tags found.");
        return [];
      }

      console.log(`[suggest] Semantically matched tags: ${matchedTags.map((t: any) => t.slug).join(", ")}`);
      const tagIds = matchedTags.map((t: any) => t.id);

      // Query memes based on these tags
      const { data: memeTagRows } = await supabase.from("meme_tags").select("meme_id").in("tag_id", tagIds);
      if (!memeTagRows || memeTagRows.length === 0) return [];

      const memeIds = Array.from(new Set(memeTagRows.map(mt => mt.meme_id))).slice(0, limit);
      const { data: memes } = await supabase
        .from("memes")
        .select("id, media_key, title, storage_provider, media_type, ocr_content, access_tier, is_active, created_at, meme_tags(tags(id, name, slug, category))")
        .in("id", memeIds)
        .eq("is_active", true);

      if (!memes) return [];

      // Save suggestion to Semantic Cache
      try {
        const finalMemeIds = memes.map(m => m.id);
        console.log(`[suggest] Saving GTE fallback result to DB cache. Vector length: ${queryVector.length}`);

        const { error: insertError } = await supabase.from("interactions").insert({
          action_type: "ai_suggestion",
          context_metadata: {
            context_text: normalizedContext,
            suggested_meme_ids: finalMemeIds
          },
          embedding: queryVector
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
      console.error("[suggest] Fallback Tag Matching error:", error);
      return [];
    }
  },

  async bulkCreate(inputs: CreateMemeInput[]): Promise<{ id: string; embeddingGenerated: boolean }[]> {
    const results: { id: string; embeddingGenerated: boolean }[] = [];
    // We process sequentially to avoid hitting rate limits too hard
    for (const input of inputs) {
      try {
        const result = await this.create(input);
        results.push(result);
      } catch (err) {
        console.error(`[bulkCreate] Failed to create one meme:`, err);
      }
    }
    return results;
  },
};
