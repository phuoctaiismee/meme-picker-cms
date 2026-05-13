"use server";

import { appClient } from "@/apis/client";
import type { TrackMemeInput } from "@/apis/client/interaction";

export async function trackMemeInteractionAction(
  action: string,
  meme: TrackMemeInput
) {
  try {
    await appClient.interaction.track(action, meme);
  } catch (error) {
    console.error("Failed to track meme interaction:", error);
  }
}
