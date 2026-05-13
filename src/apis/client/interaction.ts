import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "./audit";
import type { InteractionLog, AdminAuditLog, InteractionManagementData } from "@/apis/interfaces/interactions";

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
