import { NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || undefined;
    const maxResults = searchParams.get("max") ? parseInt(searchParams.get("max")!) : 100;

    const storage = getStorageProvider();
    const result = await storage.list({ folder, maxResults });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/media] Error listing assets:", error);
    return NextResponse.json({ error: "Failed to fetch media assets" }, { status: 500 });
  }
}
