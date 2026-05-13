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
  ViewIcon,
  ViewOffIcon
} from "@hugeicons/core-free-icons";
import { trackMemeInteractionAction } from "@/features/interactions/actions";
import { deleteMemeAction, toggleMemeStatusAction } from "@/features/memes/actions";
import { EditMemeDrawer } from "@/features/memes/components/edit-meme-drawer";
import { MemeCard } from "@/features/memes/components/meme-card";
import { DataTable } from "@/components/datas/table";
import { Pagination } from "@/components/datas/table/pagination";
import { createColumnHelper } from "@tanstack/react-table";
import type { PaginationState, SortingState, OnChangeFn } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useModal } from "@/components/layouts/modal-provider";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMemesStore } from "@/store/memes-store";
import type { Meme, MemeTag } from "@/apis/interfaces/memes";
import Link from "next/link";
import Image from "next/image";
import { useQueryState } from "nuqs";

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
  const modal = useModal();
  const queryClient = useQueryClient();

  const { selectedTagSlugs, toggleSelectedTagSlug, resetSelectedTagSlugs, viewMode, setViewMode, editingMeme, setEditingMeme } = useMemesStore();

  const [memeIdParam, setMemeIdParam] = useQueryState("meme");

  const handleOpenEdit = (meme: Meme) => {
    setEditingMeme(meme);
    void setMemeIdParam(meme.id);
  };

  const handleCloseEdit = () => {
    setEditingMeme(null);
    void setMemeIdParam(null);
  };

  React.useEffect(() => {
    if (memeIdParam && !editingMeme && memes.length > 0) {
      const found = memes.find((m) => m.id === memeIdParam);
      if (found) {
        setEditingMeme(found);
      }
    }
  }, [memeIdParam, editingMeme, memes, setEditingMeme]);

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
                    <DropdownMenuItem onClick={() => handleOpenEdit(meme)}>
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
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border shrink-0 overflow-x-auto max-w-full">
            <Button
              variant={status === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => onStatusChange("all")}
              className={cn("rounded-lg h-8 gap-1.5 px-3", status === "all" ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <HugeiconsIcon icon={Menu01Icon} className="size-3.5" />
              <span className="text-xs">All</span>
            </Button>
            <Button
              variant={status === "active" ? "default" : "ghost"}
              size="sm"
              onClick={() => onStatusChange("active")}
              className={cn("rounded-lg h-8 gap-1.5 px-3", status === "active" ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <HugeiconsIcon icon={ViewIcon} className="size-3.5" />
              <span className="text-xs">Active</span>
            </Button>
            <Button
              variant={status === "inactive" ? "default" : "ghost"}
              size="sm"
              onClick={() => onStatusChange("inactive")}
              className={cn("rounded-lg h-8 gap-1.5 px-3", status === "inactive" ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <HugeiconsIcon icon={ViewOffIcon} className="size-3.5" />
              <span className="text-xs">Inactive</span>
            </Button>
          </div>

          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border shrink-0 self-end sm:self-auto">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn("rounded-lg h-8 gap-1.5 px-3", viewMode === "grid" ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <HugeiconsIcon icon={Image01Icon} className="size-3.5" />
              <span className="text-xs">Grid</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn("rounded-lg h-8 gap-1.5 px-3", viewMode === "list" ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground")}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 relative">
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
                    <MemeCard
                      key={meme.id}
                      meme={meme}
                      onEdit={handleOpenEdit}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDeleteMeme}
                    />
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
              onClick={resetSelectedTagSlugs}
              className={cn("text-[10px] h-7 px-2 font-bold uppercase tracking-wider", selectedTagSlugs.length === 0 && "bg-primary/10 text-primary hover:bg-primary/20")}
              disabled={isLoading && tags.length === 0}
            >
              Reset
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
            {isLoading && tags.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`tag-skeleton-${i}`} className="h-7 w-12 rounded-lg" />
              ))
            ) : (
              tags.map((tag) => {
                const isSelected = selectedTagSlugs.includes(tag.slug);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleSelectedTagSlug(tag.slug)}
                    className={cn(
                      "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "bg-muted/30 border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tag.name}
                  </button>
                );
              })
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
        onOpenChange={(open) => !open && handleCloseEdit()}
      />
    </div>
  );
}
