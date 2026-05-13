"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/datas/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function EditableTagActions({ tag }: { tag: ManagedTag }) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () =>
      requestJson(`/api/tags/${tag.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags", "management"] }),
  });

  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={tag.usage_count > 0 || deleteMutation.isPending}
        onClick={() => deleteMutation.mutate()}
      >
        {deleteMutation.isPending ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}

const EditableCell = ({
  getValue,
  row,
  column,
}: any) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () =>
      requestJson(`/api/tags/${row.original.id}`, {
        method: "PATCH",
        body: JSON.stringify({ [column.id]: value }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", "management"] });
    },
  });

  const onBlur = () => {
    if (value !== initialValue) {
      updateMutation.mutate();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        className="h-8 text-sm"
        disabled={updateMutation.isPending}
      />
    </div>
  );
};

const columnHelper = createColumnHelper<ManagedTag>();

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <EditableCell {...info} />,
  }),
  columnHelper.accessor("slug", {
    header: "Slug",
    cell: (info) => <span className="text-xs text-muted-foreground">{info.getValue()}</span>,
  }),
  columnHelper.accessor("category", {
    header: "Category",
    cell: (info) => <EditableCell {...info} />,
  }),
  columnHelper.accessor("usage_count", {
    header: "Usage",
    cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => <EditableTagActions tag={info.row.original} />,
  }),
];

export function TagsScreen() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

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

  return (
    <div className="p-4 md:p-6 space-y-5 w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Tag Management</h1>
          <p className="text-sm text-muted-foreground">
            Create, edit, and remove unused meme tags. Auto-saves on blur.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {isFetching ? "Refreshing..." : "Live cache"}
        </div>
      </div>

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
    </div>
  );
}
