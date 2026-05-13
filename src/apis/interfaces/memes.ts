import type { MemeTag } from "./tags";
export type { MemeTag };

export type MediaType = "image" | "video";
export type StorageProviderId = "cloudinary";

export interface Meme {
  id: string;
  media_key: string;
  title: string | null;
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
