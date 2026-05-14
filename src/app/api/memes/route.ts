import { NextResponse } from "next/server";
import { appClient } from "@/apis/client";
import { parsePaginationParams } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = parsePaginationParams(request.url);

  try {
    return NextResponse.json(await appClient.meme.list(params));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load memes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
