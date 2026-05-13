"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import MultipleSelector, { type Option } from "@/components/ui/multiple-selector";
import { updateMemeAction } from "@/features/memes/actions";
import type { Meme } from "@/apis/interfaces/memes";
import type { MemeTag } from "@/apis/interfaces/tags";
import { accessTiers } from "@/mock-data/memes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Edit01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";

interface EditMemeDrawerProps {
  meme: Meme | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function getTagSuggestions(query: string) {
  const response = await fetch(`/api/tags?q=${encodeURIComponent(query)}`);
  const data = (await response.json()) as { tags?: MemeTag[]; error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Failed to load tags.");
  }

  return (data.tags ?? []).map((tag) => ({
    value: tag.slug,
    label: tag.name,
    category: tag.category ?? undefined,
  }));
}

export function EditMemeDrawer({ meme, open, onOpenChange }: EditMemeDrawerProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<Option[]>([]);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (meme) {
      setSelectedTags(
        meme.tags.map((tag) => ({
          label: tag.name,
          value: tag.slug,
          category: tag.category ?? undefined,
        }))
      );
      setError(null);
    }
  }, [meme]);

  if (!meme) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!meme) return;

    setIsPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    // MultipleSelector doesn't use native name, so we add it manually via hidden input or direct formData manipulation
    // But since we have a hidden input in the form, it's already there if we sync it.

    try {
      const result = await updateMemeAction(meme.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["memes"] });
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update meme.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={Edit01Icon} className="size-5" />
            </div>
            <div>
              <SheetTitle>Edit Meme</SheetTitle>
              <SheetDescription>Update meme details and settings.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form id="edit-meme-form" onSubmit={handleSubmit} className="space-y-8 px-4">
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative aspect-video rounded-xl border overflow-hidden bg-muted">
              <Image
                src={meme.media_url}
                alt={meme.title || meme.media_key}
                fill
                className="object-contain"
              />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center">
              Media Key: {meme.media_key}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="edit-title">
              Meme Title
            </label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={meme.title || ""}
              placeholder="Enter a catchy title"
              className="bg-muted/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="edit-tag-search">
              Tags
            </label>
            <input
              type="hidden"
              name="tags"
              value={selectedTags.map((tag) => tag.label).join(",")}
            />
            <MultipleSelector
              value={selectedTags}
              onChange={setSelectedTags}
              onSearch={getTagSuggestions}
              triggerSearchOnFocus
              creatable
              delay={180}
              placeholder="Search or create tags..."
              emptyIndicator={
                <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                  No tags found. Type to create.
                </div>
              }
              loadingIndicator={
                <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                  Searching tags...
                </div>
              }
              inputProps={{ id: "edit-tag-search" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="edit-access_tier">
                Access Tier
              </label>
              <Select
                id="edit-access_tier"
                name="access_tier"
                defaultValue={meme.access_tier || "free"}
                options={accessTiers.map((tier) => ({
                  label: tier.charAt(0).toUpperCase() + tier.slice(1),
                  value: tier,
                }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="edit-is_active">
                Active Status
              </label>
              <div className="flex items-center justify-between rounded-md border border-input px-4 h-9">
                <span className="text-sm">{meme.is_active ? "Enabled" : "Disabled"}</span>
                <Switch name="is_active" id="edit-is_active" defaultChecked={meme.is_active ?? true} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="edit-ocr_content">
              OCR Content (Searchable Text)
            </label>
            <textarea
              id="edit-ocr_content"
              name="ocr_content"
              rows={5}
              defaultValue={meme.ocr_content || ""}
              placeholder="Paste any text found in the meme here..."
              className="border-input bg-muted/30 min-h-32 w-full rounded-xl border px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all"
            />
          </div>
        </form>

        <SheetFooter className="border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-meme-form" disabled={isPending}>
            {isPending ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
