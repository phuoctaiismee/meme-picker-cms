"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/datas/table";
import MultipleSelector, { type Option } from "@/components/ui/multiple-selector";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon,
  Cancel01Icon,
  Loading03Icon,
  InformationCircleIcon,
  Menu01Icon,
  Activity01Icon,
  PlusSignIcon,
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

function CreateTagDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedTags, setSelectedTags] = useState<Option[]>([]);
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const modal = useModal();

  // Reset form fields when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedTags([]);
      setCategory("");
      setError(null);
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: () =>
      requestJson<{ tags: any[]; errors?: any[] }>("/api/tags", {
        method: "POST",
        body: JSON.stringify({
          names: selectedTags.map((t) => t.label.trim()),
          category: category.trim() || null,
        }),
      }),
    onSuccess: (data) => {
      setSelectedTags([]);
      setCategory("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["tags", "management"] });
      queryClient.invalidateQueries({ queryKey: ["tags", "all-list"] });
      
      if (data.errors && data.errors.length > 0) {
        const failedNames = data.errors.map((e) => `#${e.name}`).join(", ");
        modal.show({
          title: "Duplicate Tags Skipped",
          description: `Successfully created new tags, but the following tags already exist and were skipped: ${failedNames}`,
        });
      }
      onOpenChange(false);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to create tags.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={PlusSignIcon} className="size-5" />
            </div>
            <div>
              <DialogTitle>Create Tags</DialogTitle>
              <DialogDescription>Add new tags under a shared category.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="create-tag-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (selectedTags.length === 0) {
              setError("At least one tag is required.");
              return;
            }
            createMutation.mutate();
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
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
            >
              Tag Names <span className="text-destructive">*</span>
            </label>
            <MultipleSelector
              value={selectedTags}
              onChange={setSelectedTags}
              creatable
              placeholder="Type tag name and press Enter or Comma..."
              emptyIndicator={
                <div className="px-2 py-1 text-xs text-muted-foreground text-center">
                  Press Enter or Comma to add your new tag.
                </div>
              }
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="create-tag-category"
              className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
            >
              Category
            </label>
            <Input
              id="create-tag-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. reaction"
              disabled={createMutation.isPending}
            />
          </div>
        </form>

        <DialogFooter className="pt-4 border-t mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-tag-form"
            size="sm"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin mr-1.5" />
                Creating...
              </>
            ) : (
              "Create tags"
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
  const [editingTag, setEditingTag] = useState<ManagedTag | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
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

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
  };

  const selectedIds = React.useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]).map(Number),
    [rowSelection]
  );

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    if (isBulkMode) {
      setRowSelection({});
    }
  };

  // Query all tags dynamically to extract existing categories for filter tabs
  const { data: allTagsData } = useQuery({
    queryKey: ["tags", "all-list"],
    queryFn: () => requestJson<{ tags: { category: string | null }[] }>("/api/tags?mode=all"),
  });

  const categories = React.useMemo(() => {
    if (!allTagsData?.tags) return ["all", "uncategorized"];
    const cats = allTagsData.tags
      .map((t) => t.category)
      .filter(Boolean) as string[];
    return ["all", "uncategorized", ...Array.from(new Set(cats))];
  }, [allTagsData]);

  const thirdCategory = React.useMemo(() => {
    if (!categories) return null;
    const custom = categories.filter((c) => c !== "all" && c !== "uncategorized");
    if (custom.length === 0) return null;
    if (!["all", "uncategorized"].includes(selectedCategory)) {
      return selectedCategory;
    }
    return custom[0];
  }, [categories, selectedCategory]);

  const dropdownCategories = React.useMemo(() => {
    if (!categories) return [];
    return categories.filter(
      (cat) => cat !== "all" && cat !== "uncategorized" && cat !== thirdCategory
    );
  }, [categories, thirdCategory]);

  const { data, error, isFetching, isLoading } = useQuery({
    queryKey: ["tags", "management", apiParams, selectedCategory],
    queryFn: () => {
      const params = getTableSearchParams(apiParams);
      params.set("mode", "management");
      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }
      return requestJson<PaginatedResult<ManagedTag>>(`/api/tags?${params.toString()}`);
    },
    placeholderData: (prev) => prev,
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
          await queryClient.invalidateQueries({ queryKey: ["tags", "all-list"] });
        },
      });
    },
    [modal, queryClient]
  );

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;

    modal.show({
      title: `Delete ${selectedIds.length} Tags?`,
      description: `Are you sure you want to permanently delete these ${selectedIds.length} selected tags? This will fail if any of them are currently in use by active memes.`,
      confirmText: "Delete Selected",
      variant: "destructive",
      onConfirm: async () => {
        await requestJson("/api/tags", {
          method: "DELETE",
          body: JSON.stringify({ ids: selectedIds }),
        });
        setRowSelection({});
        await queryClient.invalidateQueries({ queryKey: ["tags", "management"] });
        await queryClient.invalidateQueries({ queryKey: ["tags", "all-list"] });
      },
    });
  };

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

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-sm">
        {/* Category Filter in Segmented Control Style */}
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border shrink-0 overflow-x-auto no-scrollbar max-w-full">
          <Button
            type="button"
            variant={selectedCategory === "all" ? "default" : "ghost"}
            size="xs"
            onClick={() => handleCategoryChange("all")}
            className={cn(
              "rounded-lg h-7 px-3 text-xs capitalize font-semibold cursor-pointer",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </Button>

          <Button
            type="button"
            variant={selectedCategory === "uncategorized" ? "default" : "ghost"}
            size="xs"
            onClick={() => handleCategoryChange("uncategorized")}
            className={cn(
              "rounded-lg h-7 px-3 text-xs capitalize font-semibold cursor-pointer",
              selectedCategory === "uncategorized"
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Uncategorized
          </Button>

          {thirdCategory && (
            <Button
              type="button"
              variant={selectedCategory === thirdCategory ? "default" : "ghost"}
              size="xs"
              onClick={() => handleCategoryChange(thirdCategory)}
              className={cn(
                "rounded-lg h-7 px-3 text-xs capitalize font-semibold cursor-pointer",
                selectedCategory === thirdCategory
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {thirdCategory}
            </Button>
          )}

          {dropdownCategories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant={!["all", "uncategorized", thirdCategory].includes(selectedCategory) ? "default" : "ghost"}
                    size="xs"
                    className={cn(
                      "rounded-lg h-7 px-2.5 text-xs font-semibold cursor-pointer",
                      !["all", "uncategorized", thirdCategory].includes(selectedCategory)
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    +{dropdownCategories.length}
                  </Button>
                }
              />
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  {dropdownCategories.map((cat) => (
                    <DropdownMenuItem
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className="capitalize cursor-pointer"
                    >
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tools: Bulk Select & Create Tag */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          <Button
            type="button"
            variant={isBulkMode ? "default" : "outline"}
            size="sm"
            onClick={toggleBulkMode}
            className={cn(
              "rounded-lg h-8 gap-1.5 px-3 border-dashed cursor-pointer",
              isBulkMode
                ? "bg-primary text-primary-foreground font-bold border-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground border-muted-foreground/20"
            )}
          >
            <HugeiconsIcon icon={isBulkMode ? Activity01Icon : Menu01Icon} className="size-3.5" />
            <span className="text-xs font-semibold">Bulk Select</span>
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            type="button"
            size="sm"
            className="rounded-lg h-8 gap-1.5 px-3 bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-sm shadow-primary/10"
            onClick={() => setIsCreateOpen(true)}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
            <span className="text-xs font-semibold">Create Tag</span>
          </Button>
        </div>
      </div>

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
        onGlobalFilterChange={(val) => {
          setSearch(val);
          setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
        }}
        sorting={sorting}
        onSortingChange={setSorting}
        enableSelection={isBulkMode}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(tag) => String(tag.id)}
        isRowSelectable={(tag) => tag.usage_count === 0}
      />

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-card/85 text-foreground px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-border/50 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-r pr-6">
              <span className="text-sm font-bold text-primary">{selectedIds.length}</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs font-semibold rounded-xl h-9 hover:bg-muted/50 cursor-pointer"
                onClick={() => setRowSelection({})}
              >
                Deselect All
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl h-9 px-6 shadow-lg shadow-red-500/20 cursor-pointer"
                onClick={handleBulkDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateTagDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <EditTagDialog
        tag={editingTag}
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
      />
    </div>
  );
}
