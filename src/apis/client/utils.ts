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
