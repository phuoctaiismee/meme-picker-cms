"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MultipleSelector, { type Option } from "@/components/ui/multiple-selector";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createMemeAction as createMeme, type CreateMemeState } from "@/features/memes/actions";
import type { MemeTag } from "@/apis/interfaces/tags";
import { accessTiers } from "@/mock-data/memes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Upload01Icon, Tag01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useQueryClient } from "@tanstack/react-query";
import { FileUpload } from "@/components/ui/file-upload";
import { BulkImportModal } from "./bulk-import-modal";
import { FileImportIcon } from "@hugeicons/core-free-icons";

const initialState: CreateMemeState = {};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} className="w-full sm:w-auto min-w-[140px]">
      {pending ? (
        <>
          <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin mr-2" />
          Creating...
        </>
      ) : (
        "Create Meme"
      )}
    </Button>
  );
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

export function CreateMemeForm() {
  const [state, formAction] = useActionState(createMeme, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "video" | null>(null);
  const [selectedTags, setSelectedTags] = useState<Option[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleFileChange = (file: File | null) => {
    setPreviewType(null);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });

    if (!file) return;

    setPreviewType(file.type.startsWith("video/") ? "video" : "image");
    setPreviewUrl(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!state.error && state !== initialState) {
      queryClient.invalidateQueries({ queryKey: ["memes"] });
    }
  }, [state, queryClient]);

  return (
    <form action={formAction} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Create New Meme</h1>
          <Button 
            type="button" 
            variant="outline" 
            className="gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
            onClick={() => setIsBulkModalOpen(true)}
          >
            <HugeiconsIcon icon={FileImportIcon} className="size-4" />
            Bulk Import from Excel
          </Button>
        </div>

        {state.error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0" />
            {state.error}
          </div>
        )}

        <div className="rounded-2xl border bg-card p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold border-b pb-4 mb-2">
            <HugeiconsIcon icon={Upload01Icon} className="size-4 text-primary" />
            Media & Details
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="title">
                Meme Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Enter a catchy title (optional)"
                className="bg-muted/30"
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="text-sm font-medium">
                Upload File <span className="text-destructive">*</span>
              </label>
              <FileUpload
                id="file"
                name="file"
                accept="image/*,video/*"
                maxSize={MAX_FILE_SIZE}
                onChange={handleFileChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold border-b pb-4 mb-2">
            <HugeiconsIcon icon={Tag01Icon} className="size-4 text-primary" />
            Classification
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="tag-search">
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
                inputProps={{ id: "tag-search" }}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 pt-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="access_tier">
                  Access Tier
                </label>
                <Select
                  id="access_tier"
                  name="access_tier"
                  defaultValue="free"
                  options={accessTiers.map((tier) => ({
                    label: tier.charAt(0).toUpperCase() + tier.slice(1),
                    value: tier,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium" htmlFor="is_active">
                  Active Status
                </label>
                <div className="flex items-center justify-between rounded-md border border-input px-4 h-9">
                  <span className="text-sm">Enabled</span>
                  <Switch name="is_active" id="is_active" defaultChecked />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="ocr_content">
              OCR Content (Searchable Text)
            </label>
            <textarea
              id="ocr_content"
              name="ocr_content"
              rows={4}
              placeholder="Paste any text found in the meme here to make it searchable..."
              className="border-input bg-muted/30 min-h-24 w-full rounded-xl border px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <SubmitButton />
        </div>
      </div>

      <aside className="space-y-6">
        <div className="sticky top-6">
          <div className="overflow-hidden rounded-2xl p-2 border bg-muted shadow-sm aspect-4/5 relative flex items-center justify-center">
            {previewUrl && previewType === "video" ? (
              <video src={previewUrl} controls className="size-full object-cover rounded-lg" />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Meme preview" className="size-full object-cover rounded-lg" />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <div className="size-12 rounded-full bg-background flex items-center justify-center mb-4 border shadow-sm">
                  <HugeiconsIcon icon={Upload01Icon} className="size-6 opacity-50" />
                </div>
                <p className="text-sm font-medium">Live Preview</p>
                <p className="text-xs mt-1">Upload a file to see it here</p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border bg-primary/5 p-4 text-xs text-muted-foreground flex gap-3">
            <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0 text-primary" />
            <p>
              Meme details will be saved to the database, and media will be hosted on Cloudinary for global edge delivery.
            </p>
          </div>
        </div>
      </aside>

      <BulkImportModal open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen} />
    </form>
  );
}
