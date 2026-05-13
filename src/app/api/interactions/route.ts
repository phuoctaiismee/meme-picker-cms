import { NextResponse } from "next/server";
import { appClient } from "@/apis/client";

export async function GET() {
  try {
    return NextResponse.json(await appClient.interaction.getAll());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load interactions.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
