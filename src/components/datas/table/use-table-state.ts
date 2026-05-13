"use client";

import { useState } from "react";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { useDebounce } from "@/hooks/use-debounce";

interface UseTableStateOptions {
  initialPageIndex?: number;
  initialPageSize?: number;
  initialSorting?: SortingState;
  debounceMs?: number;
}

export function useTableState(options: UseTableStateOptions = {}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: options.initialPageIndex ?? 0,
    pageSize: options.initialPageSize ?? 10,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, options.debounceMs ?? 500);
  const [sorting, setSorting] = useState<SortingState>(options.initialSorting ?? []);
  const [status, setStatus] = useState<"all" | "active" | "inactive">("active");

  return {
    pagination,
    setPagination,
    search,
    setSearch,
    debouncedSearch,
    sorting,
    setSorting,
    status,
    setStatus,
    apiParams: {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: debouncedSearch || undefined,
      sortBy: sorting.length > 0 ? sorting[0].id : undefined,
      sortOrder: sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined,
      status: status !== "active" ? status : undefined, // Send status if not default
    },
  };
}

export function getTableSearchParams(apiParams: any) {
  const params = new URLSearchParams({
    page: apiParams.page.toString(),
    pageSize: apiParams.pageSize.toString(),
  });
  if (apiParams.search) params.set("search", apiParams.search);
  if (apiParams.status) params.set("status", apiParams.status);
  if (apiParams.tags) params.set("tags", apiParams.tags);
  if (apiParams.sortBy) {
    params.set("sortBy", apiParams.sortBy);
    params.set("sortOrder", apiParams.sortOrder || "asc");
  }
  return params;
}
