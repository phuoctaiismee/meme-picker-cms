import type { PaginationParams } from "@/apis/interfaces/pagination";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

/**
 * Applies common pagination and sorting to a Supabase query builder.
 */
export function applyPaginationAndSorting<T extends Record<string, any>>(
  query: any, // Using any here because Supabase query types are complex generics
  params: PaginationParams,
  options: { defaultSortBy: string; defaultSortOrder?: "asc" | "desc" }
) {
  const { page, pageSize, sortBy, sortOrder } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let builder = query.range(from, to);

  if (sortBy) {
    builder = builder.order(sortBy, { ascending: sortOrder === "asc" });
  } else {
    builder = builder.order(options.defaultSortBy, {
      ascending: options.defaultSortOrder === "asc",
    });
  }

  return builder;
}

/**
 * Generates GTE embedding for a given text by calling the GTE Model Server.
 */
export async function getGTEEmbedding(text: string): Promise<number[]> {
  const serverUrl = process.env.GTE_API_URL || "http://localhost:7860";
  const res = await fetch(`${serverUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: [text] }),
  });
  if (!res.ok) {
    throw new Error(`GTE model server returned status ${res.status}: ${await res.text()}`);
  }
  const data = await res.json() as { embeddings: number[][] };
  return data.embeddings[0];
}

