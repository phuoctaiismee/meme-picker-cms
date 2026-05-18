"use client";

import * as React from "react";
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
import MultipleSelector from "@/components/ui/multiple-selector";
import { updateMemeAction } from "@/features/memes/actions";
import type { Meme } from "@/apis/interfaces/memes";
import type { MemeTag } from "@/apis/interfaces/tags";
import { accessTiers } from "@/mock-data/memes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Edit01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { MediaPicker } from "@/components/datas/media-picker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  if (!meme) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto" key={meme.id}>
        <EditMemeForm meme={meme} onOpenChange={onOpenChange} />
      </SheetContent>
    </Sheet>
  );
}



import { useQueryClient, useMutation } from "@tanstack/react-query";


const editMemeSchema = z.object({
  title: z.string().trim().optional(),
  ocr_content: z.string().trim().optional(),
  access_tier: z.string(),
  is_active: z.boolean(),
  tags: z.array(z.object({
    label: z.string(),
    value: z.string(),
    category: z.string().optional(),
  })),
  media_key: z.string(),
});

type EditMemeValues = z.infer<typeof editMemeSchema>;

function EditMemeForm({ meme, onOpenChange }: { meme: Meme; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();

  const [showMediaPicker, setShowMediaPicker] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const { control, handleSubmit, watch, formState: { isDirty, isSubmitting } } = useForm<EditMemeValues>({
    resolver: zodResolver(editMemeSchema),
    defaultValues: {
      title: meme.title || "",
      ocr_content: meme.ocr_content || "",
      access_tier: meme.access_tier || "free",
      is_active: meme.is_active ?? true,
      tags: meme.tags.map((tag) => ({
        label: tag.name,
        value: tag.slug,
        category: tag.category ?? undefined,
      })),
      media_key: meme.media_key,
    },
  });

  const currentMediaKey = watch("media_key");
  const currentIsActive = watch("is_active");

  const { mutate: updateMeme, isPending, error } = useMutation({
    mutationFn: async (data: EditMemeValues) => {
      const formData = new FormData();
      formData.set("title", data.title || "");
      formData.set("ocr_content", data.ocr_content || "");
      formData.set("access_tier", data.access_tier);
      formData.set("is_active", data.is_active ? "on" : "off");
      formData.set("tags", data.tags.map((tag) => tag.label).join(","));

      if (selectedFile) {
        formData.set("file", selectedFile);
      } else if (data.media_key !== meme.media_key) {
        formData.set("media_key", data.media_key);
        // We need the URL for the update action if it's from gallery
        // But the updateMemeAction should ideally handle just key.
        // Let's check the updateMemeAction again.
      }

      const result = await updateMemeAction(meme.id, formData);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memes"] });
      onOpenChange(false);
    }
  });

  const onSubmit = (data: EditMemeValues) => {
    updateMeme(data);
  };

  const errorMessage = error instanceof Error ? error.message : null;
  const isReallyDirty = isDirty || !!selectedFile;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SheetHeader className="border-b shrink-0 px-6 py-4">
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

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <form id="edit-meme-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6">
          {errorMessage && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <Controller
              name="media_key"
              control={control}
              render={({ field }) => (
                <>
                  <div className="relative aspect-video rounded-xl border overflow-hidden bg-muted group cursor-pointer" onClick={() => setShowMediaPicker(true)}>
                    <Image
                      src={previewUrl || (field.value === meme.media_key ? meme.media_url : `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${field.value}`)}
                      alt={meme.title || field.value}
                      fill
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
                      <HugeiconsIcon icon={Edit01Icon} className="size-8 mb-1" />
                      <p className="text-xs font-bold uppercase tracking-wider">Change Image</p>
                    </div>
                    {(selectedFile || field.value !== meme.media_key) && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg shadow-lg">
                        {selectedFile ? "NEW UPLOAD" : "FROM GALLERY"}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center">
                    {selectedFile ? `New File: ${selectedFile.name}` : `Media Key: ${field.value}`}
                  </p>

                  <MediaPicker
                    open={showMediaPicker}
                    onOpenChange={setShowMediaPicker}
                    onSelect={(asset) => {
                      if (asset.file) {
                        setSelectedFile(asset.file);
                        setPreviewUrl(asset.url);
                        field.onChange(meme.media_key); // keep original key if it's a new upload for now
                      } else {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        field.onChange(asset.key);
                      }
                    }}
                  />
                </>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="edit-title">
              Meme Title
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="edit-title"
                  placeholder="Enter a catchy title"
                  className="bg-muted/30 h-10 rounded-xl"
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="edit-tag-search">
              Tags
            </label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <MultipleSelector
                  value={field.value}
                  onChange={field.onChange}
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
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="edit-access_tier">
                Access Tier
              </label>
              <Controller
                name="access_tier"
                control={control}
                render={({ field }) => (
                  <Select
                    id="edit-access_tier"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={accessTiers.map((tier) => ({
                      label: tier.charAt(0).toUpperCase() + tier.slice(1),
                      value: tier,
                    }))}
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="edit-is_active">
                Status
              </label>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 h-10">
                    <span className="text-xs font-medium uppercase tracking-wider">{field.value ? "Active" : "Disabled"}</span>
                    <Switch checked={field.value} onCheckedChange={field.onChange} id="edit-is_active" />
                  </div>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="edit-ocr_content">
              OCR Content (Searchable Text)
            </label>
            <Controller
              name="ocr_content"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  id="edit-ocr_content"
                  rows={5}
                  placeholder="Paste any text found in the meme here..."
                  className="border-input bg-muted/30 min-h-32 w-full rounded-xl border px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all no-scrollbar"
                />
              )}
            />
          </div>
        </form>
      </div>

      <SheetFooter className="border-t shrink-0 p-6 bg-background flex flex-row items-center gap-3">
        <Button
          variant="outline"
          className="flex-1 rounded-xl h-11"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit-meme-form"
          className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-primary/20"
          disabled={isPending || !isReallyDirty}
        >
          {isPending ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </SheetFooter>
    </div>
  );
}
