import { NextResponse } from "next/server";
import { getInteractionManagementData } from "@/lib/memes/data";

export async function GET() {
  try {
    return NextResponse.json(await getInteractionManagementData());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load interactions.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
