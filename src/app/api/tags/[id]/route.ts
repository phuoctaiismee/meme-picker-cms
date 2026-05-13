import { NextResponse } from "next/server";
import { appClient } from "@/apis/client";
import { getAdminDatabaseErrorMessage } from "@/apis/client/audit";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function getTagId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new Error("Tag id is required.");
  }
  return id;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = getTagId(rawId);
    
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const category = String(body.category ?? "").trim() || null;

    await appClient.tag.update({ id, name, category });

    return NextResponse.json({ tag: { id, name, category } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update tag.";
    return NextResponse.json(
      { error: getAdminDatabaseErrorMessage(message) },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = getTagId(rawId);

    await appClient.tag.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete tag.";
    return NextResponse.json(
      { error: getAdminDatabaseErrorMessage(message) },
      { status: 400 }
    );
  }
}
