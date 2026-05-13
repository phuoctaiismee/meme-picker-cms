import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminAuditAction =
  | "meme.create"
  | "meme.copy_media_key"
  | "meme.open_media"
  | "meme.update"
  | "meme.delete"
  | "tag.create"
  | "tag.update"
  | "tag.delete";

interface LogAdminActionInput {
  action: AdminAuditAction;
  entityType: "meme" | "tag";
  entityId?: string | number | null;
  metadata?: Record<string, unknown>;
}

export async function logAdminAction({
  action,
  entityType,
  entityId,
  metadata = {},
}: LogAdminActionInput) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to track admin actions.");
  }

  const { error } = await supabase.from("admin_audit_logs").insert({
    admin_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId == null ? null : String(entityId),
    metadata,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function getAdminDatabaseErrorMessage(message: string) {
  if (message.toLowerCase().includes("row-level security")) {
    return "Your account is signed in but is not allowed to manage memes. Set role = 'admin' on your user_profiles row.";
  }

  return message;
}
