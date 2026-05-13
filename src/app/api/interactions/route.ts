import { NextResponse } from "next/server";
import { appClient } from "@/apis/client";
import { parsePaginationParams } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const params = parsePaginationParams(request.url);

  try {
    if (type === "audit") {
      return NextResponse.json(await appClient.interaction.listAuditLogs(params));
    }
    return NextResponse.json(await appClient.interaction.listInteractions(params));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load logs.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
