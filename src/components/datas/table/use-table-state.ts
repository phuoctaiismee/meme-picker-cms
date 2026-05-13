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

  return {
    pagination,
    setPagination,
    search, // For the input value (immediate)
    setSearch,
    debouncedSearch, // For API calls or filtering
    sorting,
    setSorting,
    // Helper to get raw params for API calls
    apiParams: {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: debouncedSearch || undefined, // Use debounced search here
      sortBy: sorting.length > 0 ? sorting[0].id : undefined,
      sortOrder: sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined,
    },
  };
}

export function getTableSearchParams(apiParams: any) {
  const params = new URLSearchParams({
    page: apiParams.page.toString(),
    pageSize: apiParams.pageSize.toString(),
  });
  if (apiParams.search) params.set("search", apiParams.search);
  if (apiParams.sortBy) {
    params.set("sortBy", apiParams.sortBy);
    params.set("sortOrder", apiParams.sortOrder || "asc");
  }
  return params;
}
