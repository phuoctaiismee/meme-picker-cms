"use client";

import * as React from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Image01Icon,
  Menu01Icon,
  MoreVerticalIcon,
  Loading03Icon,
  PlusSignIcon,
  TagsIcon,
  Activity01Icon,
  CheckmarkCircle02Icon,
  ViewIcon,
  ViewOffIcon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";
import { trackMemeInteractionAction } from "@/features/interactions/actions";
import { deleteMemeAction, toggleMemeStatusAction } from "@/features/memes/actions";
import { EditMemeDrawer } from "@/features/memes/components/edit-meme-drawer";
import { DataTable } from "@/components/datas/table";
import { Pagination } from "@/components/datas/table/pagination";
import { createColumnHelper } from "@tanstack/react-table";
import type { PaginationState, SortingState, OnChangeFn } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useModal } from "@/components/layouts/modal-provider";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  status: "all" | "active" | "inactive";
  onStatusChange: (status: "all" | "active" | "inactive") => void;
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
  status,
  onStatusChange,
}: MemeListProps) {
  const [editingMeme, setEditingMeme] = React.useState<Meme | null>(null);
  const modal = useModal();
  const queryClient = useQueryClient();

  const { selectedTagSlug, setSelectedTagSlug, viewMode, setViewMode } = useMemesStore();

  const handleDeleteMeme = (meme: Meme) => {
    const isActive = meme.is_active;
    modal.show({
      title: isActive ? "Deactivate Meme?" : "Delete Permanently?",
      description: isActive 
        ? `Are you sure you want to deactivate "${meme.title || meme.media_key}"? It will be hidden from the library but can be restored later from the Inactive filter.`
        : `Are you sure you want to PERMANENTLY delete "${meme.title || meme.media_key}"? This will remove the record from the database and delete the file from storage. This action cannot be undone.`,
      confirmText: isActive ? "Deactivate" : "Delete Permanently",
      variant: "destructive",
      onConfirm: async () => {
        const result = await deleteMemeAction(meme.id);
        if (result.error) {
          throw new Error(result.error);
        }
        await queryClient.invalidateQueries({ queryKey: ["memes"] });
      },
    });
  };

  const handleToggleStatus = async (meme: Meme, isActive: boolean) => {
    const result = await toggleMemeStatusAction(meme.id, isActive);
    if (result.error) {
      modal.show({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["memes"] });
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
      columnHelper.display({
        id: "tags",
        header: "Tags",
        cell: (info) => (
          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
            {info.row.original.tags.map((tag: MemeTag) => (
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
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-sm mb-6">
          <div className="relative w-full sm:max-w-md">
            <Input
              placeholder="Search by title or OCR content..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pr-9 rounded-xl bg-muted/20 border-transparent focus:bg-background transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isLoading && (
                <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin text-muted-foreground" />
              )}
              {!isLoading && search && (
                <button onClick={() => onSearchChange("")} className="hover:text-foreground text-muted-foreground">
                  <HugeiconsIcon icon={PlusSignIcon} className="size-3 rotate-45" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn("rounded-lg h-8 gap-2", viewMode === "grid" && "bg-background shadow-sm")}
            >
              <HugeiconsIcon icon={Image01Icon} className="size-3.5" />
              <span className="text-xs">Grid</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn("rounded-lg h-8 gap-2", viewMode === "list" && "bg-background shadow-sm")}
            >
              <HugeiconsIcon icon={Menu01Icon} className="size-3.5" />
              <span className="text-xs">List</span>
            </Button>
          </div>
        </div>

        {memes.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-20 text-center shadow-sm">
            <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <HugeiconsIcon
                icon={Image01Icon}
                className="size-7 text-muted-foreground"
              />
            </div>
            <h2 className="font-semibold text-xl mb-1">No memes found</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              We couldn't find any memes matching your criteria. Try adjusting your search or upload a new one.
            </p>
            <Link href={'/create'}>
              <Button type="button" className="gap-2">
                <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
                Create New Meme
              </Button>
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 relative">
              {isLoading && memes.length === 0 ? (
                Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="rounded-2xl border bg-card overflow-hidden space-y-4 p-4 shadow-sm">
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-14 rounded-lg" />
                      <Skeleton className="h-6 w-20 rounded-lg" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {isLoading && memes.length > 0 && (
                    <div className="absolute inset-0 bg-background/40 z-20 flex items-center justify-center backdrop-blur-[2px] rounded-2xl">
                      <HugeiconsIcon icon={Loading03Icon} className="h-10 w-10 animate-spin text-primary" />
                    </div>
                  )}
                  {memes.map((meme) => (
                    <article
                      key={meme.id}
                      className={cn(
                        "group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:bg-muted/50",
                        !meme.is_active && "opacity-80 grayscale-[0.3]"
                      )}
                    >
                      {/* Media Area */}
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden border-b">
                        {meme.media_type === "video" ? (
                          <video
                            src={meme.media_url}
                            className="size-full object-cover"
                            muted
                            loop
                            playsInline
                            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                            onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                          />
                        ) : (
                          <Image
                            src={meme.media_url}
                            alt={meme.title || meme.ocr_content || meme.media_key}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          />
                        )}
                        
                        {/* Status Badges - Top Right for cleaner look */}
                        <div className="absolute top-2 right-2 z-10 flex gap-1.5">
                          {!meme.is_active && (
                            <div className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-orange-500/90 text-white shadow-sm backdrop-blur-sm">
                              Inactive
                            </div>
                          )}
                          <div className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/50 text-white shadow-sm backdrop-blur-sm border border-white/10">
                            {meme.access_tier}
                          </div>
                        </div>

                        {/* Quick View Button */}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="secondary" 
                            size="icon-xs" 
                            className="size-7 rounded-lg bg-white/95 dark:bg-black/80 shadow-lg border-none"
                            onClick={() => window.open(meme.media_url, "_blank")}
                          >
                            <HugeiconsIcon icon={Image01Icon} className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-3.5 flex-1 flex flex-col space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate leading-snug text-foreground/90 group-hover:text-primary transition-colors">
                              {meme.title || "Untitled Meme"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <HugeiconsIcon icon={Activity01Icon} className="size-3" />
                                {new Date(meme.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon-xs" className="size-7 rounded-lg hover:bg-muted-foreground/10 transition-colors -mr-1">
                                  <HugeiconsIcon icon={MoreVerticalIcon} className="size-3.5" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl shadow-xl">
                              <DropdownMenuGroup className="space-y-0.5">
                                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => setEditingMeme(meme)}>
                                  <HugeiconsIcon icon={Activity01Icon} className="size-4" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="rounded-lg gap-2 cursor-pointer"
                                  onClick={() => handleToggleStatus(meme, !meme.is_active)}
                                >
                                  {meme.is_active ? (
                                    <>
                                      <HugeiconsIcon icon={ViewOffIcon} className="size-4 text-orange-500" /> 
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <HugeiconsIcon icon={ViewIcon} className="size-4 text-emerald-500" /> 
                                      Restore
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem 
                                  className="rounded-lg gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer" 
                                  onClick={() => handleDeleteMeme(meme)}
                                >
                                  <HugeiconsIcon icon={Alert01Icon} className="size-4" /> Delete {meme.is_active ? "Softly" : "Permanently"}
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Tags Area */}
                        <div className="flex flex-wrap gap-1.5 overflow-hidden">
                          {meme.tags.slice(0, 2).map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTagSlug(tag.slug);
                              }}
                              className="px-2 py-0.5 rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary text-[9px] font-semibold text-muted-foreground transition-colors border border-transparent"
                            >
                              #{tag.name}
                            </button>
                          ))}
                          {meme.tags.length > 2 && (
                            <span className="text-[9px] font-medium text-muted-foreground/50 self-center">
                              +{meme.tags.length - 2}
                            </span>
                          )}
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

      <aside className="w-full xl:w-80 shrink-0 space-y-6">
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
            </div>
            <h2 className="font-semibold text-sm">Visibility Status</h2>
          </div>
          <div className="flex flex-col gap-2">
            {(["active", "inactive", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStatusChange(s)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition-all",
                  status === s
                    ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted/30 border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="capitalize">{s}</span>
                {status === s && <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={TagsIcon} className="size-4" />
              </div>
              <h2 className="font-semibold text-sm">Filter by Tags</h2>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setSelectedTagSlug(null)}
              className={cn("text-[10px] h-7 px-2 font-bold uppercase tracking-wider", !selectedTagSlug && "bg-primary/10 text-primary hover:bg-primary/20")}
              disabled={isLoading && tags.length === 0}
            >
              Reset
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
            {isLoading && tags.length === 0 ? (
              Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={`tag-skeleton-${i}`} className="h-7 w-16 rounded-lg" />
              ))
            ) : (
              tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTagSlug(tag.slug === selectedTagSlug ? null : tag.slug)}
                  className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                    selectedTagSlug === tag.slug
                      ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted/30 border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tag.name}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
              <HugeiconsIcon icon={Activity01Icon} className="size-4" />
            </div>
            <h2 className="font-semibold text-sm">Quick Stats</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-muted/20 border border-transparent">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Total Memes</p>
              {isLoading && memes.length === 0 ? (
                <Skeleton className="h-6 w-12 mt-1" />
              ) : (
                <p className="text-xl font-bold mt-0.5">{total.toLocaleString()}</p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-muted/20 border border-transparent">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Total Tags</p>
              {isLoading && tags.length === 0 ? (
                <Skeleton className="h-6 w-8 mt-1" />
              ) : (
                <p className="text-xl font-bold mt-0.5">{tags.length}</p>
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
