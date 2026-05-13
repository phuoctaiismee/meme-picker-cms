"use server";

import { logAdminAction, type AdminAuditAction } from "@/lib/memes/audit";

const memeInteractionActions = new Set<AdminAuditAction>([
  "meme.copy_media_key",
  "meme.open_media",
]);

export async function trackMemeInteraction(
  action: AdminAuditAction,
  meme: {
    id: string;
    media_key: string;
  }
) {
  if (!memeInteractionActions.has(action)) {
    throw new Error("Unsupported meme interaction action.");
  }

  await logAdminAction({
    action,
    entityType: "meme",
    entityId: meme.id,
    metadata: {
      media_key: meme.media_key,
    },
  });
}
