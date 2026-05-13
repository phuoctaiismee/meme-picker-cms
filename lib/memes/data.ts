import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStorageProvider } from "@/lib/memes/storage";
import type {
  AdminAuditLog,
  InteractionLog,
  InteractionManagementData,
  Meme,
  MemeListData,
  MemeTag,
  TagManagementData,
} from "@/lib/memes/types";

interface MemeTagJoin {
  tags: MemeTag | MemeTag[] | null;
}

interface MemeRow {
  id: string;
  media_key: string;
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

export async function getMemeListData(): Promise<MemeListData> {
  const supabase = await createSupabaseServerClient();

  const [{ data: memeRows, error: memesError }, { data: tagRows, error: tagsError }] =
    await Promise.all([
      supabase
        .from("memes")
        .select(
          "id, media_key, storage_provider, media_type, ocr_content, access_tier, is_active, created_at, meme_tags(tags(id, name, slug, category))"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase.from("tags").select("id, name, slug, category").order("name"),
    ]);

  if (memesError) {
    throw new Error(memesError.message);
  }

  if (tagsError) {
    throw new Error(tagsError.message);
  }

  return {
    memes: ((memeRows ?? []) as MemeRow[]).map(mapMeme),
    tags: (tagRows ?? []) as MemeTag[],
  };
}

export async function getTagManagementData(): Promise<TagManagementData> {
  const supabase = await createSupabaseServerClient();

  const [{ data: tagRows, error: tagsError }, { data: joinRows, error: joinsError }] =
    await Promise.all([
      supabase.from("tags").select("id, name, slug, category").order("name"),
      supabase.from("meme_tags").select("tag_id"),
    ]);

  if (tagsError) {
    throw new Error(tagsError.message);
  }

  if (joinsError) {
    throw new Error(joinsError.message);
  }

  const usageCounts = new Map<number, number>();

  for (const join of (joinRows ?? []) as { tag_id: number }[]) {
    usageCounts.set(join.tag_id, (usageCounts.get(join.tag_id) ?? 0) + 1);
  }

  return {
    tags: ((tagRows ?? []) as MemeTag[]).map((tag) => ({
      ...tag,
      usage_count: usageCounts.get(tag.id) ?? 0,
    })),
  };
}

export async function getInteractionManagementData(): Promise<InteractionManagementData> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: interactionRows, error: interactionsError },
    { data: auditRows, error: auditError },
  ] = await Promise.all([
    supabase
      .from("interactions")
      .select("id, user_id, meme_id, action_type, platform, context_metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("admin_audit_logs")
      .select("id, admin_id, action, entity_type, entity_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (interactionsError) {
    throw new Error(interactionsError.message);
  }

  if (auditError) {
    throw new Error(auditError.message);
  }

  return {
    interactions: (interactionRows ?? []) as InteractionLog[],
    auditLogs: (auditRows ?? []) as AdminAuditLog[],
  };
}
