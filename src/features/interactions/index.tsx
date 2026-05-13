"use client";

import { useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/datas/table";
import type { InteractionLog, AdminAuditLog } from "@/apis/interfaces/interactions";
import type { PaginatedResult } from "@/apis/interfaces/pagination";
import { useTableState, getTableSearchParams } from "@/components/datas/table/use-table-state";

async function getPaginatedLogs<T>(type: "interactions" | "audit", apiParams: any): Promise<PaginatedResult<T>> {
  const params = getTableSearchParams(apiParams);
  params.set("type", type);

  const response = await fetch(`/api/interactions?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Failed to load ${type} logs.`);
  }

  return data;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMetadata(value: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) {
    return "-";
  }
  return JSON.stringify(value);
}

const interactionHelper = createColumnHelper<InteractionLog>();
const interactionColumns = [
  interactionHelper.accessor("action_type", {
    header: "Action",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  interactionHelper.accessor("platform", {
    header: "Platform",
    cell: (info) => info.getValue() ?? "-",
  }),
  interactionHelper.accessor("meme_id", {
    header: "Meme",
    cell: (info) => (
      <span className="max-w-40 truncate text-xs text-muted-foreground block">
        {info.getValue() ?? "-"}
      </span>
    ),
  }),
  interactionHelper.accessor("user_id", {
    header: "User",
    cell: (info) => (
      <span className="max-w-40 truncate text-xs text-muted-foreground block">
        {info.getValue() ?? "-"}
      </span>
    ),
  }),
  interactionHelper.accessor("context_metadata", {
    header: "Metadata",
    enableSorting: false,
    cell: (info) => (
      <span className="max-w-72 truncate text-xs text-muted-foreground block">
        {formatMetadata(info.getValue())}
      </span>
    ),
  }),
  interactionHelper.accessor("created_at", {
    header: "Created",
    cell: (info) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(info.getValue())}
      </span>
    ),
  }),
];

const auditHelper = createColumnHelper<AdminAuditLog>();
const auditColumns = [
  auditHelper.accessor("action", {
    header: "Action",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  auditHelper.accessor("entity_type", {
    header: "Entity",
    cell: (info) => (
      <span>
        {info.getValue()}
        {info.row.original.entity_id && (
          <span className="ml-2 text-xs text-muted-foreground">
            {info.row.original.entity_id}
          </span>
        )}
      </span>
    ),
  }),
  auditHelper.accessor("admin_id", {
    header: "Admin",
    cell: (info) => (
      <span className="max-w-40 truncate text-xs text-muted-foreground block">
        {info.getValue()}
      </span>
    ),
  }),
  auditHelper.accessor("metadata", {
    header: "Metadata",
    enableSorting: false,
    cell: (info) => (
      <span className="max-w-72 truncate text-xs text-muted-foreground block">
        {formatMetadata(info.getValue())}
      </span>
    ),
  }),
  auditHelper.accessor("created_at", {
    header: "Created",
    cell: (info) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(info.getValue())}
      </span>
    ),
  }),
];

export function InteractionsScreen() {
  const intState = useTableState();
  const auditState = useTableState();

  const { data: intData, isLoading: intLoading, isFetching: intFetching } = useQuery({
    queryKey: ["interactions", intState.apiParams],
    queryFn: () => getPaginatedLogs<InteractionLog>("interactions", intState.apiParams),
    placeholderData: (prev) => prev,
  });

  const { data: auditData, isLoading: auditLoading, isFetching: auditFetching } = useQuery({
    queryKey: ["audit", auditState.apiParams],
    queryFn: () => getPaginatedLogs<AdminAuditLog>("audit", auditState.apiParams),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="p-4 md:p-6 space-y-10 w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Interaction Management</h1>
          <p className="text-sm text-muted-foreground">
            Review user interactions and CMS admin audit events.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">User interactions</h2>
          <p className="text-xs text-muted-foreground">
            Detailed logs of user actions.
          </p>
        </div>
        <DataTable
          columns={interactionColumns}
          data={intData?.data ?? []}
          isLoading={intLoading || intFetching}
          searchPlaceholder="Search interactions..."
          manualPagination={true}
          manualFiltering={true}
          manualSorting={true}
          pageCount={intData?.pageCount ?? 0}
          total={intData?.total ?? 0}
          pagination={intState.pagination}
          onPaginationChange={intState.setPagination}
          globalFilter={intState.search}
          onGlobalFilterChange={intState.setSearch}
          sorting={intState.sorting}
          onSortingChange={intState.setSorting}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-medium">Admin audit</h2>
          <p className="text-xs text-muted-foreground">
            Record of changes made by administrators.
          </p>
        </div>
        <DataTable
          columns={auditColumns}
          data={auditData?.data ?? []}
          isLoading={auditLoading || auditFetching}
          searchPlaceholder="Search audit logs..."
          manualPagination={true}
          manualFiltering={true}
          manualSorting={true}
          pageCount={auditData?.pageCount ?? 0}
          total={auditData?.total ?? 0}
          pagination={auditState.pagination}
          onPaginationChange={auditState.setPagination}
          globalFilter={auditState.search}
          onGlobalFilterChange={auditState.setSearch}
          sorting={auditState.sorting}
          onSortingChange={auditState.setSorting}
        />
      </section>
    </div>
  );
}
