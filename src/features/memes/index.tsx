"use client";

import { useQuery } from "@tanstack/react-query";
import { MemeList } from "./components/meme-list";
import type { Meme, MemeTag } from "@/apis/interfaces/memes";
import type { PaginatedResult } from "@/apis/interfaces/pagination";
import { useTableState, getTableSearchParams } from "@/components/datas/table/use-table-state";

async function getMemes(apiParams: any): Promise<PaginatedResult<Meme>> {
  const params = getTableSearchParams(apiParams);
  const response = await fetch(`/api/memes?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load memes.");
  }

  return data;
}

async function getTags(): Promise<{ tags: MemeTag[] }> {
  const response = await fetch("/api/tags");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load tags.");
  }

  return data;
}

export function MemeScreen() {
  const {
    pagination,
    setPagination,
    search,
    setSearch,
    sorting,
    setSorting,
    status,
    setStatus,
    apiParams,
  } = useTableState();

  const { data: memesData, isLoading: isLoadingMemes, isFetching: isFetchingMemes } = useQuery({
    queryKey: ["memes", apiParams],
    queryFn: () => getMemes(apiParams),
    placeholderData: (previousData) => previousData,
  });

  const { data: tagsData, isLoading: isLoadingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
  });

  const isInitialLoading = isLoadingTags && !tagsData;

  return (
    <MemeList 
      memes={memesData?.data ?? []} 
      tags={tagsData?.tags ?? []}
      isLoading={isLoadingMemes || isFetchingMemes || isInitialLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      pageCount={memesData?.pageCount ?? 0}
      total={memesData?.total ?? 0}
      search={search}
      onSearchChange={setSearch}
      sorting={sorting}
      onSortingChange={setSorting}
      status={status}
      onStatusChange={setStatus}
    />
  );
}
