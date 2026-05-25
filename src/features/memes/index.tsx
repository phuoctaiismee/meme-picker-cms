"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MemeList } from "./components/meme-list";
import type { Meme, MemeTag } from "@/apis/interfaces/memes";
import type { PaginatedResult } from "@/apis/interfaces/pagination";
import { useTableState, getTableSearchParams } from "@/components/datas/table/use-table-state";

import { useMemesStore } from "@/store/memes-store";

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
  const selectedTagSlugs = useMemesStore((state) => state.selectedTagSlugs);
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

  // Reset pagination to page 1 when search, status, or tag filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, status, selectedTagSlugs, setPagination]);

  const fullApiParams = {
    ...apiParams,
    tags: selectedTagSlugs.length > 0 ? selectedTagSlugs.join(",") : undefined,
  };

  const { data: memesData, isLoading: isLoadingMemes, isFetching: isFetchingMemes } = useQuery({
    queryKey: ["memes", fullApiParams],
    queryFn: () => getMemes(fullApiParams),
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
