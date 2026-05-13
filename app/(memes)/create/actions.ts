"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminDatabaseErrorMessage, logAdminAction } from "@/lib/memes/audit";
import { parseTags } from "@/lib/memes/slug";
import { getStorageProvider } from "@/lib/memes/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CreateMemeState {
  error?: string;
}

const maxUploadBytes = 25 * 1024 * 1024;

function getFile(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please choose a meme image or video.");
  }

  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    throw new Error("Only image and video uploads are supported.");
  }

  if (file.size > maxUploadBytes) {
    throw new Error("Uploads must be 25 MB or smaller.");
  }

  return file;
}

export async function createMeme(
  _previousState: CreateMemeState,
  formData: FormData
): Promise<CreateMemeState> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "You must be signed in to create memes." };
    }

    const file = getFile(formData);
    const tags = parseTags(formData.get("tags"));

    if (tags.length === 0) {
      return { error: "Add at least one tag." };
    }

    const storageProvider = getStorageProvider("cloudinary");
    const upload = await storageProvider.upload({
      file,
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "meme-picker-cms",
    });

    const { data: meme, error: memeError } = await supabase
      .from("memes")
      .insert({
        media_key: upload.key,
        storage_provider: storageProvider.id,
        media_type: upload.mediaType,
        ocr_content: String(formData.get("ocr_content") ?? "").trim() || null,
        access_tier: String(formData.get("access_tier") ?? "free"),
        is_active: formData.get("is_active") === "on",
      })
      .select("id")
      .single();

    if (memeError || !meme) {
      throw new Error(memeError?.message || "Failed to save meme.");
    }

    const tagRows = await Promise.all(
      tags.map(async (tag) => {
        const { data, error } = await supabase
          .from("tags")
          .upsert(
            { name: tag.name, slug: tag.slug, category: "general" },
            { onConflict: "slug" }
          )
          .select("id")
          .single();

        if (error || !data) {
          throw new Error(error?.message || `Failed to save tag ${tag.name}.`);
        }

        return data;
      })
    );

    const { error: joinError } = await supabase.from("meme_tags").insert(
      tagRows.map((tag) => ({
        meme_id: meme.id,
        tag_id: tag.id,
      }))
    );

    if (joinError) {
      throw new Error(joinError.message);
    }

    await logAdminAction({
      action: "meme.create",
      entityType: "meme",
      entityId: meme.id,
      metadata: {
        media_key: upload.key,
        media_type: upload.mediaType,
        tag_ids: tagRows.map((tag) => tag.id),
        tag_slugs: tags.map((tag) => tag.slug),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create meme.";

    return {
      error: getAdminDatabaseErrorMessage(message),
    };
  }

  revalidatePath("/");
  redirect("/");
}
