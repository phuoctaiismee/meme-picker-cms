"use client";

import { type ChangeEvent, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MultipleSelector, { type Option } from "@/components/ui/multiple-selector";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createMemeAction as createMeme, type CreateMemeState } from "@/features/memes/actions";
import type { MemeTag } from "@/apis/interfaces/tags";
import { accessTiers } from "@/mock-data/memes";

const initialState: CreateMemeState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Uploading..." : "Create meme"}
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setPreviewType(null);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return null;
    });

    if (!file) {
      return;
    }

    setPreviewType(file.type.startsWith("video/") ? "video" : "image");
    setPreviewUrl(URL.createObjectURL(file));
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive xl:col-span-2">
          {state.error}
        </div>
      )}

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="file">
            Meme file
          </label>
          <Input
            id="file"
            name="file"
            type="file"
            accept="image/*,video/*"
            required
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">
            Images and videos are uploaded to Cloudinary.
          </p>
        </div>

        <div className="space-y-2">
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
            placeholder="Search or create tags"
            emptyIndicator={
              <div className="px-2 py-2 text-sm text-muted-foreground">
                No tags found.
              </div>
            }
            loadingIndicator={
              <div className="px-2 py-2 text-sm text-muted-foreground">
                Loading tags...
              </div>
            }
            inputProps={{ id: "tag-search" }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="access_tier">
              Access tier
            </label>
            <Select
              id="access_tier"
              name="access_tier"
              defaultValue="free"
              options={accessTiers.map((tier) => ({
                label: tier,
                value: tier,
              }))}
            />
          </div>

           <div className="space-y-2">
             <label className="text-sm font-medium" htmlFor="is_active">
              Active
            </label>
            <Switch name="is_active" defaultChecked aria-label="Active meme" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ocr_content">
            OCR content
          </label>
          <textarea
            id="ocr_content"
            name="ocr_content"
            rows={5}
            placeholder="Optional searchable text from the meme"
            className="border-input bg-background min-h-28 w-full rounded-md border px-2.5 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
        </div>

        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </div>

      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border bg-muted">
          <div className="aspect-video">
            {previewUrl && previewType === "video" ? (
              <video src={previewUrl} controls className="size-full object-contain" />
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Meme preview" className="size-full object-contain" />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Preview
              </div>
            )}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground">
          Preview updates locally before upload. The final media URL is created after
          Cloudinary upload succeeds.
        </div>
      </div>
    </form>
  );
}
