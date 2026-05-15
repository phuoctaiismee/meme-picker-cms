"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/datas/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useModal } from "@/components/layouts/modal-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Cancel01Icon,
  Loading03Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import type { ManagedTag } from "@/apis/interfaces/tags";
import type { PaginatedResult } from "@/apis/interfaces/pagination";
import { useTableState, getTableSearchParams } from "@/components/datas/table/use-table-state";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

function EditTagDialog({
  tag,
  open,
  onOpenChange,
}: {
  tag: ManagedTag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (tag) {
      setName(tag.name || "");
      setCategory(tag.category || "");
      setError(null);
    }
  }, [tag]);

  const updateMutation = useMutation({
    mutationFn: () =>
      requestJson(`/api/tags/${tag?.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), category: category.trim() || null }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", "management"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to update tag.");
    },
  });

  if (!tag) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={Edit01Icon} className="size-5" />
            </div>
            <div>
              <DialogTitle>Edit Tag</DialogTitle>
              <DialogDescription>Update tag details and category.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="edit-tag-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (!name.trim()) {
              setError("Tag name is required.");
              return;
            }
            updateMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="edit-tag-name"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
            >
              Tag Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. funny"
              required
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-tag-category"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
            >
              Category
            </label>
            <Input
              id="edit-tag-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. reaction"
              disabled={updateMutation.isPending}
            />
          </div>
        </form>

        <DialogFooter className="pt-4 border-t mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-tag-form"
            size="sm"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const columnHelper = createColumnHelper<ManagedTag>();

export function TagsScreen() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [editingTag, setEditingTag] = useState<ManagedTag | null>(null);
  const modal = useModal();

  const {
    pagination,
    setPagination,
    search,
    setSearch,
    sorting,
    setSorting,
    apiParams,
  } = useTableState();

  const { data, error, isFetching, isLoading } = useQuery({
    queryKey: ["tags", "management", apiParams],
    queryFn: () => {
      const params = getTableSearchParams(apiParams);
      params.set("mode", "management");
      return requestJson<PaginatedResult<ManagedTag>>(`/api/tags?${params.toString()}`);
    },
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      requestJson("/api/tags", {
        method: "POST",
        body: JSON.stringify({ name, category }),
      }),
    onSuccess: () => {
      setName("");
      setCategory("");
      queryClient.invalidateQueries({ queryKey: ["tags", "management"] });
    },
  });

  const handleDeleteTag = React.useCallback(
    (tag: ManagedTag) => {
      if (tag.usage_count > 0) return;

      modal.show({
        title: "Delete Tag?",
        description: `Are you sure you want to permanently delete the tag "#${tag.name}"? This action cannot be undone.`,
        confirmText: "Delete Tag",
        variant: "destructive",
        onConfirm: async () => {
          await requestJson(`/api/tags/${tag.id}`, { method: "DELETE" });
          await queryClient.invalidateQueries({ queryKey: ["tags", "management"] });
        },
      });
    },
    [modal, queryClient]
  );

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => <span className="font-semibold text-sm">#{info.getValue()}</span>,
      }),
      columnHelper.accessor("slug", {
        header: "Slug",
        cell: (info) => <span className="text-xs text-muted-foreground">{info.getValue()}</span>,
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span className="text-muted-foreground/50 text-xs">—</span>;
          return (
            <span className="inline-flex text-[10px] bg-muted px-2 py-0.5 rounded font-semibold text-muted-foreground uppercase tracking-wider">
              {val}
            </span>
          );
        },
      }),
      columnHelper.accessor("usage_count", {
        header: "Usage",
        enableSorting: false,
        cell: (info) => <span className="font-medium text-sm">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const tag = info.row.original;
          return (
            <div className="flex justify-end gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                      onClick={() => setEditingTag(tag)}
                    >
                      <HugeiconsIcon icon={Edit01Icon} className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent>Edit tag</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className={cn("inline-block", tag.usage_count > 0 && "cursor-not-allowed")}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className={cn(
                          "size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer",
                          tag.usage_count > 0 && "opacity-50 pointer-events-none"
                        )}
                        onClick={() => handleDeleteTag(tag)}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                      </Button>
                    </span>
                  }
                />
                <TooltipContent>
                  {tag.usage_count > 0 ? "Cannot delete tag currently in use" : "Delete tag"}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        },
      }),
    ],
    [handleDeleteTag]
  );

  return (
    <div className="p-4 md:p-6 space-y-5 w-full">

      <form
        className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_220px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate();
        }}
      >
        <Input
          value={name}
          placeholder="Tag name"
          required
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          value={category}
          placeholder="Category"
          onChange={(event) => setCategory(event.target.value)}
        />
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create tag"}
        </Button>
      </form>

      {createMutation.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {createMutation.error.message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchPlaceholder="Search tags..."
        manualPagination={true}
        manualFiltering={true}
        manualSorting={true}
        pageCount={data?.pageCount ?? 0}
        total={data?.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        sorting={sorting}
        onSortingChange={setSorting}
      />

      <EditTagDialog
        tag={editingTag}
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
      />
    </div>
  );
}
