import { NextResponse } from "next/server";
import { appClient } from "@/apis/client";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { context, limit = 5 } = body;

    if (!context || typeof context !== "string") {
      return NextResponse.json({ error: "Context is required" }, { status: 400 });
    }

    console.log("[/api/suggest] context:", context.slice(0, 100));

    const memes = await appClient.meme.suggest(context, limit);

    console.log("[/api/suggest] returned memes:", memes.length);

    return NextResponse.json(memes, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to suggest memes";
    console.error("[/api/suggest] error:", error);
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
