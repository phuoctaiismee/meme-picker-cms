export type MediaType = "image" | "video";
export type StorageProviderId = "cloudinary";

export interface MemeTag {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  usage_count?: number;
}

export interface Meme {
  id: string;
  media_key: string;
  media_url: string;
  storage_provider: StorageProviderId | string | null;
  media_type: MediaType | string | null;
  ocr_content: string | null;
  access_tier: string | null;
  is_active: boolean | null;
  created_at: string;
  tags: MemeTag[];
}

export interface MemeListData {
  memes: Meme[];
  tags: MemeTag[];
}

export interface ManagedTag extends MemeTag {
  usage_count: number;
}

export interface TagManagementData {
  tags: ManagedTag[];
}

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
