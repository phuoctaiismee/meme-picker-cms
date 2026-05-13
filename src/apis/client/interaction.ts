import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "./audit";
import type { InteractionLog, AdminAuditLog, InteractionManagementData } from "@/apis/interfaces/interactions";
import type { PaginatedResult, PaginationParams } from "@/apis/interfaces/pagination";
import { applyPaginationAndSorting } from "./utils";

export interface TrackMemeInput {
  id: string;
  media_key: string;
}

const memeInteractionActions = new Set([
  "meme.copy_media_key",
  "meme.open_media",
] as const);

export type MemeInteractionAction = typeof memeInteractionActions extends Set<infer T> ? T : never;

export const interaction = {
  async getAll(): Promise<InteractionManagementData> {
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

    if (interactionsError) throw new Error(interactionsError.message);
    if (auditError) throw new Error(auditError.message);

    return {
      interactions: (interactionRows ?? []) as InteractionLog[],
      auditLogs: (auditRows ?? []) as AdminAuditLog[],
    };
  },

  async listInteractions(params: PaginationParams): Promise<PaginatedResult<InteractionLog>> {
    const supabase = await createSupabaseServerClient();
    const { page, pageSize, search } = params;

    let query = supabase
      .from("interactions")
      .select("id, user_id, meme_id, action_type, platform, context_metadata, created_at", { count: "exact" });

    query = applyPaginationAndSorting(query, params, {
      defaultSortBy: "created_at",
      defaultSortOrder: "desc",
    });

    if (search?.trim()) {
      const s = search.trim();
      query = query.or(`action_type.ilike.%${s}%,platform.ilike.%${s}%`);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const total = count ?? 0;
    return {
      data: (data ?? []) as InteractionLog[],
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async listAuditLogs(params: PaginationParams): Promise<PaginatedResult<AdminAuditLog>> {
    const supabase = await createSupabaseServerClient();
    const { page, pageSize, search } = params;

    let query = supabase
      .from("admin_audit_logs")
      .select("id, admin_id, action, entity_type, entity_id, metadata, created_at", { count: "exact" });

    query = applyPaginationAndSorting(query, params, {
      defaultSortBy: "created_at",
      defaultSortOrder: "desc",
    });

    if (search?.trim()) {
      const s = search.trim();
      query = query.or(`action.ilike.%${s}%,entity_type.ilike.%${s}%`);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const total = count ?? 0;
    return {
      data: (data ?? []) as AdminAuditLog[],
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  },

  async track(action: string, meme: TrackMemeInput): Promise<void> {
    if (!memeInteractionActions.has(action as MemeInteractionAction)) {
      throw new Error("Unsupported meme interaction action.");
    }

    await logAdminAction({
      action: action as any,
      entityType: "meme",
      entityId: meme.id,
      metadata: {
        media_key: meme.media_key,
      },
    });
  },
};
