"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type FilterFn,
  type PaginationState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "./pagination";
import {
  Loading03Icon,
  Sorting01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  searchPlaceholder?: string;
  
  // Server-side props
  pageCount?: number;
  total?: number;
  isLoading?: boolean;
  
  // State from parent
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;

  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  
  manualPagination?: boolean;
  manualFiltering?: boolean;
  manualSorting?: boolean;
  
  /** Custom global filter function for client-side filtering. */
  globalFilterFn?: FilterFn<TData>;
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = "Search...",
  pageCount: serverPageCount,
  total,
  isLoading,
  pagination: externalPagination,
  onPaginationChange,
  globalFilter: externalGlobalFilter,
  onGlobalFilterChange,
  sorting: externalSorting,
  onSortingChange,
  manualPagination = false,
  manualFiltering = false,
  manualSorting = false,
  globalFilterFn,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");

  const pagination = externalPagination ?? internalPagination;
  const globalFilter = externalGlobalFilter ?? internalGlobalFilter;
  const sorting = externalSorting ?? internalSorting;

  const table = useReactTable({
    data,
    columns,
    pageCount: serverPageCount,
    manualPagination,
    manualFiltering,
    manualSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    onSortingChange: onSortingChange ?? setInternalSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    state: {
      sorting,
      pagination,
      globalFilter,
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      if (onPaginationChange) onPaginationChange(next);
      else setInternalPagination(next);
    },
    onGlobalFilterChange: (value) => {
      if (onGlobalFilterChange) onGlobalFilterChange(value);
      else setInternalGlobalFilter(value);
    },
    globalFilterFn: globalFilterFn ?? "includesString",
  });

  const filterValue = externalGlobalFilter ?? internalGlobalFilter;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder={searchPlaceholder}
            value={filterValue}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          {isLoading && <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {total !== undefined && (
          <div className="text-sm text-muted-foreground">
            Total {total.toLocaleString()} items
          </div>
        )}
      </div>
      
      <div className="rounded-md border bg-card relative overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            canSort && "cursor-pointer select-none hover:text-foreground transition-colors"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                              {sorted === "asc" ? (
                                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3.5 text-primary" />
                              ) : sorted === "desc" ? (
                                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-primary" />
                              ) : (
                                <HugeiconsIcon icon={Sorting01Icon} className="size-3.5 text-muted-foreground/50" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && data.length === 0 ? (
              Array.from({ length: pagination.pageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={`skeleton-cell-${j}`}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="relative group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {isLoading && data.length > 0 && (
          <div className="absolute inset-0 bg-background/30 z-10 flex items-center justify-center backdrop-blur-[1px]">
             <HugeiconsIcon icon={Loading03Icon} className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-muted-foreground">Rows per page</p>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
            options={[5, 10, 20, 30, 40, 50, 100].map(v => ({ label: v.toString(), value: v.toString() }))}
            className="w-20"
          />
        </div>
        
        <Pagination
          pageCount={table.getPageCount()}
          currentPage={pagination.pageIndex}
          onPageChange={(page) => table.setPageIndex(page)}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
