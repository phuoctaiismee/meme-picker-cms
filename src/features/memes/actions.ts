"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { appClient } from "@/apis/client";
import { getAdminDatabaseErrorMessage } from "@/apis/client/audit";
import { parseTags } from "@/lib/slug";

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

export async function createMemeAction(
  _previousState: CreateMemeState,
  formData: FormData
): Promise<CreateMemeState> {
  try {
    const file = getFile(formData);
    const tags = parseTags(formData.get("tags"));

    if (tags.length === 0) {
      return { error: "Add at least one tag." };
    }

    const ocr_content = String(formData.get("ocr_content") ?? "").trim() || undefined;
    const access_tier = String(formData.get("access_tier") ?? "free");
    const is_active = formData.get("is_active") === "on";

    await appClient.meme.create({
      file,
      tags,
      ocr_content,
      access_tier,
      is_active,
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

export async function updateMemeTitleAction(id: string, title: string | null) {
  try {
    await appClient.meme.updateTitle(id, title);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update meme.";
    return { error: getAdminDatabaseErrorMessage(message) };
  }
}

export async function deleteMemeAction(id: string) {
  try {
    await appClient.meme.delete(id);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete meme.";
    return { error: getAdminDatabaseErrorMessage(message) };
  }
}
