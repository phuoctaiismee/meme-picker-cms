"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Image01Icon,
  Menu01Icon,
  MoreVerticalIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons";
import { trackMemeInteraction } from "@/app/(memes)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMemesStore } from "@/store/memes-store";
import type { Meme, MemeTag } from "@/lib/memes/types";

interface MemeListProps {
  memes: Meme[];
  tags: MemeTag[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function matchesSearch(meme: Meme, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return (
    meme.ocr_content?.toLowerCase().includes(normalized) ||
    meme.media_key.toLowerCase().includes(normalized) ||
    meme.tags.some((tag) => {
      return (
        tag.name.toLowerCase().includes(normalized) ||
        tag.slug.toLowerCase().includes(normalized)
      );
    })
  );
}

function trackInteraction(action: "meme.copy_media_key" | "meme.open_media", meme: Meme) {
  void trackMemeInteraction(action, {
    id: meme.id,
    media_key: meme.media_key,
  });
}

export function MemeList({ memes, tags }: MemeListProps) {
  const { searchQuery, selectedTagSlug, setSelectedTagSlug, viewMode } =
    useMemesStore();

  const filteredMemes = memes.filter((meme) => {
    const hasTag = selectedTagSlug
      ? meme.tags.some((tag) => tag.slug === selectedTagSlug)
      : true;

    return hasTag && matchesSearch(meme, searchQuery);
  });

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-4 md:p-6">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Meme Library</h1>
            <p className="text-sm text-muted-foreground">
              {filteredMemes.length} active memes
            </p>
          </div>
        </div>

        {filteredMemes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <HugeiconsIcon
                icon={Image01Icon}
                className="size-7 text-muted-foreground"
              />
            </div>
            <h2 className="font-medium text-lg mb-1">No memes found</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Upload a meme or adjust the current search and tag filter.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredMemes.map((meme) => (
              <article
                key={meme.id}
                className="rounded-xl border bg-card overflow-hidden"
              >
                <div className="aspect-video bg-muted">
                  {meme.media_type === "video" ? (
                    <video
                      src={meme.media_url}
                      controls
                      className="size-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={meme.media_url}
                      alt={meme.ocr_content || meme.media_key}
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {meme.media_key}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(meme.created_at)} · {meme.access_tier}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="size-8">
                            <HugeiconsIcon
                              icon={MoreVerticalIcon}
                              className="size-4"
                            />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => {
                              void navigator.clipboard.writeText(meme.media_key);
                              trackInteraction("meme.copy_media_key", meme);
                            }}
                          >
                            Copy media key
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              window.open(meme.media_url, "_blank", "noopener,noreferrer");
                              trackInteraction("meme.open_media", meme);
                            }}
                          >
                            Open media
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {meme.tags.map((tag) => (
                      <Button
                        key={tag.id}
                        type="button"
                        variant="secondary"
                        size="xs"
                        className="rounded-md bg-muted px-2 py-1 text-xs"
                        onClick={() => setSelectedTagSlug(tag.slug)}
                      >
                        {tag.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="hidden md:grid grid-cols-[1.4fr_120px_120px_1fr] gap-4 px-4 py-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
              <span>Meme</span>
              <span>Type</span>
              <span>Tier</span>
              <span>Tags</span>
            </div>
            <div className="divide-y">
              {filteredMemes.map((meme) => (
                <div
                  key={meme.id}
                  className="grid grid-cols-1 md:grid-cols-[1.4fr_120px_120px_1fr] gap-3 px-4 py-3 items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      <HugeiconsIcon
                        icon={meme.media_type === "video" ? Video01Icon : Image01Icon}
                        className="size-5 text-muted-foreground"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {meme.media_key}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(meme.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {meme.media_type}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {meme.access_tier}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {meme.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-md bg-muted px-2 py-1 text-xs"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="w-full xl:w-72 shrink-0 space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm">Tags</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTagSlug(null)}
              className={cn(!selectedTagSlug && "bg-muted")}
            >
              All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Button
                key={tag.id}
                type="button"
                variant={selectedTagSlug === tag.slug ? "default" : "outline"}
                size="xs"
                className={cn(
                  "rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                  selectedTagSlug === tag.slug
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
                onClick={() => setSelectedTagSlug(tag.slug)}
              >
                {tag.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <HugeiconsIcon icon={Menu01Icon} className="size-4" />
            Library status
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Memes</p>
              <p className="font-medium">{memes.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Tags</p>
              <p className="font-medium">{tags.length}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
