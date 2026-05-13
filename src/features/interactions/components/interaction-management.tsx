"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InteractionManagementData } from "@/apis/interfaces/interactions";

async function getInteractions() {
  const response = await fetch("/api/interactions");
  const data = (await response.json()) as InteractionManagementData & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "Failed to load interactions.");
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

export function InteractionManagement({
  initialData,
}: {
  initialData: InteractionManagementData;
}) {
  const { data, error, isFetching } = useQuery({
    queryKey: ["interactions", "management"],
    queryFn: getInteractions,
    initialData,
    refetchInterval: 20_000,
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Interaction Management</h1>
          <p className="text-sm text-muted-foreground">
            Review user interactions and CMS admin audit events.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {isFetching ? "Refreshing..." : "Live cache"}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">User interactions</h2>
          <p className="text-xs text-muted-foreground">
            Latest {data.interactions.length} interaction rows.
          </p>
        </div>
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Meme</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Metadata</TableHead>
                <TableHead className="w-36">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.interactions.map((interaction) => (
                <TableRow key={interaction.id}>
                  <TableCell className="font-medium">
                    {interaction.action_type}
                  </TableCell>
                  <TableCell>{interaction.platform ?? "-"}</TableCell>
                  <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                    {interaction.meme_id ?? "-"}
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                    {interaction.user_id ?? "-"}
                  </TableCell>
                  <TableCell className="max-w-72 truncate text-xs text-muted-foreground">
                    {formatMetadata(interaction.context_metadata)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(interaction.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Admin audit</h2>
          <p className="text-xs text-muted-foreground">
            Latest {data.auditLogs.length} CMS events.
          </p>
        </div>
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Metadata</TableHead>
                <TableHead className="w-36">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>
                    {log.entity_type}
                    {log.entity_id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {log.entity_id}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                    {log.admin_id}
                  </TableCell>
                  <TableCell className="max-w-72 truncate text-xs text-muted-foreground">
                    {formatMetadata(log.metadata)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(log.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
