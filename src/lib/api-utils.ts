import type { PaginationParams } from "@/apis/interfaces/pagination";

const DEFAULT_PAGE_SIZE = 20;

export function parsePaginationParams(url: string): PaginationParams {
  const { searchParams } = new URL(url);
  
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE))
  );
  const search = searchParams.get("search") ?? undefined;
  const sortBy = searchParams.get("sortBy") ?? undefined;
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") ?? undefined;

  return {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
  };
}
