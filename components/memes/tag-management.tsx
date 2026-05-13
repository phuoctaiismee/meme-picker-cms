"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ManagedTag, TagManagementData } from "@/lib/memes/types";

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

function EditableTagRow({ tag }: { tag: ManagedTag }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(tag.name);
  const [category, setCategory] = useState(tag.category ?? "");

  const updateMutation = useMutation({
    mutationFn: () =>
      requestJson(`/api/tags/${tag.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, category }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags", "management"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      requestJson(`/api/tags/${tag.id}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags", "management"] }),
  });

  const isDirty = name !== tag.name || category !== (tag.category ?? "");
  const isPending = updateMutation.isPending || deleteMutation.isPending;
  const error = updateMutation.error ?? deleteMutation.error;

  return (
    <TableRow>
      <TableCell>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
        {error && (
          <p className="mt-1 text-xs text-destructive">{error.message}</p>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{tag.slug}</TableCell>
      <TableCell>
        <Input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </TableCell>
      <TableCell className="text-muted-foreground">{tag.usage_count}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!isDirty || isPending}
            onClick={() => updateMutation.mutate()}
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={tag.usage_count > 0 || isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TagManagement({ initialData }: { initialData: TagManagementData }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const tagsQuery = useQuery({
    queryKey: ["tags", "management"],
    queryFn: () => requestJson<TagManagementData>("/api/tags?mode=management"),
    initialData,
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
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Tag Management</h1>
        <p className="text-sm text-muted-foreground">
          Create, edit, and remove unused meme tags.
        </p>
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

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-24">Usage</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tagsQuery.data.tags.map((tag) => (
              <EditableTagRow key={tag.id} tag={tag} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
