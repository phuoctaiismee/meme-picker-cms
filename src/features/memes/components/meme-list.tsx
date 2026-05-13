"use client";

import * as React from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Image01Icon,
  Menu01Icon,
  MoreVerticalIcon,
  Video01Icon,
  Loading03Icon,
  Pulse02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { trackMemeInteractionAction } from "@/features/interactions/actions";
import { deleteMemeAction } from "@/features/memes/actions";
import { EditMemeDrawer } from "@/features/memes/components/edit-meme-drawer";
import { DataTable } from "@/components/datas/table";
import { Pagination } from "@/components/datas/table/pagination";
import { createColumnHelper, type PaginationState, type SortingState, type OnChangeFn } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useModal } from "@/components/layouts/modal-provider";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMemesStore } from "@/store/memes-store";
import type { Meme, MemeTag } from "@/apis/interfaces/memes";
import Link from "next/link";
import Image from "next/image";

interface MemeListProps {
  memes: Meme[];
  tags: MemeTag[];
  isLoading?: boolean;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  pageCount: number;
  total: number;
  search: string;
  onSearchChange: (search: string) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function trackInteraction(action: "meme.copy_media_key" | "meme.open_media", meme: Meme) {
  void trackMemeInteractionAction(action, {
    id: meme.id,
    media_key: meme.media_key,
  });
}

const columnHelper = createColumnHelper<Meme>();

export function MemeList({
  memes,
  tags,
  isLoading,
  pagination,
  onPaginationChange,
  pageCount,
  total,
  search,
  onSearchChange,
  sorting,
  onSortingChange,
}: MemeListProps) {
  const [editingMeme, setEditingMeme] = React.useState<Meme | null>(null);
  const modal = useModal();
  const queryClient = useQueryClient();

  const { selectedTagSlug, setSelectedTagSlug, viewMode } = useMemesStore();

  const handleDeleteMeme = (meme: Meme) => {
    modal.show({
      title: "Delete Meme",
      description: `Are you sure you want to delete "${meme.title || meme.media_key}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        const result = await deleteMemeAction(meme.id);
        if (result.error) {
          throw new Error(result.error);
        }
        // Invalidate queries to revalidate data on the home page
        await queryClient.invalidateQueries({ queryKey: ["memes"] });
      },
    });
  };

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "title",
        header: "Media",
        cell: (info) => (
          <div className="flex items-center gap-3 min-w-0 max-w-[240px]">
            <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
              <Image 
                src={info.row.original.media_url} 
                alt={info.row.original.title || info.row.original.media_key} 
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" title={info.row.original.title || info.row.original.media_key}>
                {info.row.original.title || info.row.original.media_key}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(info.row.original.created_at)}
              </p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("media_type", {
        header: "Type",
        cell: (info) => <span className="text-sm text-muted-foreground">{info.getValue()}</span>,
      }),
      columnHelper.accessor("access_tier", {
        header: "Tier",
        cell: (info) => <span className="text-sm text-muted-foreground">{info.getValue()}</span>,
      }),
      columnHelper.accessor("created_at", {
        header: "Created",
        cell: (info) => <span className="text-sm text-muted-foreground">{formatDate(info.getValue())}</span>,
      }),
      columnHelper.accessor("tags", {
        header: "Tags",
        enableSorting: false,
        cell: (info) => (
          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
            {info.getValue().map((tag) => (
              <span
                key={tag.id}
                className="rounded-md bg-muted px-2 py-1 text-xs"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const meme = info.row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="size-8">
                      <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => {
                        void navigator.clipboard.writeText(meme.media_key);
                        trackInteraction("meme.copy_media_key", meme);
                      }}
                    >
                      Copy media key
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        window.open(meme.media_url, "_blank", "noopener,noreferrer");
                        trackInteraction("meme.open_media", meme);
                      }}
                    >
                      Open media
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingMeme(meme)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => handleDeleteMeme(meme)}>
                      Delete meme
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-4 md:p-6">
      <div className="flex-1 min-w-0 space-y-4">

        {memes.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <HugeiconsIcon
                icon={Image01Icon}
                className="size-7 text-muted-foreground"
              />
            </div>
            <h2 className="font-medium text-lg mb-1">No memes found</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-2.5">
              Upload a meme or adjust the current search.
            </p>
            <Link href={'/create'}>
              <Button type="button" variant="outline" size="sm">
                <HugeiconsIcon icon={PlusSignIcon}/>Create Now
              </Button>
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 relative">
              {isLoading && memes.length === 0 ? (
                Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="rounded-xl border bg-card overflow-hidden space-y-3 p-3">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="flex gap-1.5">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {isLoading && memes.length > 0 && (
                    <div className="absolute inset-0 bg-background/30 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                      <HugeiconsIcon icon={Loading03Icon} className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  {memes.map((meme) => (
                    <article
                      key={meme.id}
                      className="rounded-xl border bg-card overflow-hidden"
                    >
                      <div className="aspect-video bg-muted relative">
                        {meme.media_type === "video" ? (
                          <video
                            src={meme.media_url}
                            controls
                            className="size-full object-cover"
                          />
                        ) : (
                          <Image
                            src={meme.media_url}
                            alt={meme.title || meme.ocr_content || meme.media_key}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="p-3 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate" title={meme.title || meme.media_key}>
                              {meme.title || meme.media_key}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(meme.created_at)} · {meme.access_tier}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="size-8">
                                  <HugeiconsIcon
                                    icon={MoreVerticalIcon}
                                    className="size-4"
                                  />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  onClick={() => {
                                    void navigator.clipboard.writeText(meme.media_key);
                                    trackInteraction("meme.copy_media_key", meme);
                                  }}
                                >
                                  Copy media key
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    window.open(meme.media_url, "_blank", "noopener,noreferrer");
                                    trackInteraction("meme.open_media", meme);
                                  }}
                                >
                                  Open media
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setEditingMeme(meme)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => handleDeleteMeme(meme)}
                                >
                                  Delete meme
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {meme.tags.map((tag) => (
                            <Button
                              key={tag.id}
                              type="button"
                              variant="secondary"
                              size="xs"
                              className="rounded-md bg-muted px-2 py-1 text-xs"
                              onClick={() => setSelectedTagSlug(tag.slug)}
                            >
                              {tag.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </>
              )}
            </div>

            <div className="flex items-center justify-between px-2 pt-4 border-t">
              <div className="text-sm text-muted-foreground font-medium">
                {isLoading && memes.length === 0 ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <>Showing {memes.length} of {total.toLocaleString()} memes</>
                )}
              </div>
              <Pagination
                pageCount={pageCount}
                currentPage={pagination.pageIndex}
                onPageChange={(page) => onPaginationChange({ ...pagination, pageIndex: page })}
                disabled={isLoading}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden p-2">
            <DataTable
              columns={columns}
              data={memes}
              searchPlaceholder="Filter memes in table..."
              manualPagination={true}
              manualFiltering={true}
              manualSorting={true}
              pageCount={pageCount}
              total={total}
              pagination={pagination}
              onPaginationChange={onPaginationChange}
              globalFilter={search}
              onGlobalFilterChange={onSearchChange}
              sorting={sorting}
              onSortingChange={onSortingChange}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      <aside className="w-full xl:w-72 shrink-0 space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm">Tags</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTagSlug(null)}
              className={cn(!selectedTagSlug && "bg-muted")}
              disabled={isLoading && tags.length === 0}
            >
              All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {isLoading && tags.length === 0 ? (
              Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={`tag-skeleton-${i}`} className="h-7 w-16 rounded-md" />
              ))
            ) : (
              tags.map((tag) => (
                <Button
                  key={tag.id}
                  type="button"
                  variant={selectedTagSlug === tag.slug ? "default" : "outline"}
                  size="xs"
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                    selectedTagSlug === tag.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                  onClick={() => setSelectedTagSlug(tag.slug)}
                >
                  {tag.name}
                </Button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <HugeiconsIcon icon={Menu01Icon} className="size-4" />
            Library status
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Memes</p>
              {isLoading && memes.length === 0 ? (
                <Skeleton className="h-5 w-12 mt-1" />
              ) : (
                <p className="font-medium">{total.toLocaleString()}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Tags</p>
              {isLoading && tags.length === 0 ? (
                <Skeleton className="h-5 w-8 mt-1" />
              ) : (
                <p className="font-medium">{tags.length}</p>
              )}
            </div>
          </div>
        </div>
      </aside>
      <EditMemeDrawer
        meme={editingMeme}
        open={!!editingMeme}
        onOpenChange={(open) => !open && setEditingMeme(null)}
      />
    </div>
  );
}
