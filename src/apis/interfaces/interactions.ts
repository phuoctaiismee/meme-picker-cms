export interface InteractionLog {
  id: number;
  user_id: string | null;
  meme_id: string | null;
  action_type: string | null;
  platform: string | null;
  context_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminAuditLog {
  id: number;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface InteractionManagementData {
  interactions: InteractionLog[];
  auditLogs: AdminAuditLog[];
}
