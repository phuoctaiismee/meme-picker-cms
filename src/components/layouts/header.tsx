"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GridViewIcon,
  Menu01Icon,
  Search01Icon,
  TagsIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useMemesStore } from "@/store/memes-store";
import { useDebounce } from "@/hooks/use-debounce";
import { MemeBreadcrumb } from "./breadcrumb";
import type { Meme, MemeTag } from "@/apis/interfaces/memes";

export function MemesHeader() {
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    resetSelectedTagSlugs,
    toggleSelectedTagSlug,
    setEditingMeme,
  } = useMemesStore();

  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [foundTags, setFoundTags] = useState<MemeTag[]>([]);
  const [foundMemes, setFoundMemes] = useState<Meme[]>([]);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFoundTags([]);
      setFoundMemes([]);
      return;
    }

    async function fetchResults() {
      setIsLoading(true);
      try {
        const q = encodeURIComponent(debouncedQuery.trim());
        const [tagsRes, memesRes] = await Promise.all([
          fetch(`/api/tags?q=${q}`),
          fetch(`/api/memes?search=${q}&pageSize=5`),
        ]);

        if (tagsRes.ok) {
          const tData = await tagsRes.json();
          setFoundTags(tData.tags || []);
        }
        if (memesRes.ok) {
          const mData = await memesRes.json();
          setFoundMemes(mData.data || []);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchResults();
  }, [debouncedQuery]);

  const handleSelectTag = (tag: MemeTag) => {
    resetSelectedTagSlugs();
    toggleSelectedTagSlug(tag.slug);
    setIsFocused(false);
    setSearchQuery("");
    router.push("/memes");
  };

  const handleSelectMeme = (meme: Meme) => {
    setEditingMeme(meme);
    setIsFocused(false);
    setSearchQuery("");
    router.push(`/memes?meme=${meme.id}`);
  };

  return (
    <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 border-b bg-card sticky top-0 z-50 w-full">
      <SidebarTrigger className="-ml-1 sm:-ml-2" />

      <div className="min-w-0">
        <MemeBreadcrumb />
      </div>

      <div ref={containerRef} className="hidden md:block relative ml-auto w-full max-w-xs">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <Input
          placeholder="Search memes or tags..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          className="pl-9 h-9 bg-card border"
        />

        {/* Global Search Command Results Popover */}
        {isFocused && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 duration-150 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground gap-2 text-xs">
                <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                <span>Searching library...</span>
              </div>
            ) : foundTags.length === 0 && foundMemes.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No results found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="space-y-3">
                {foundTags.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Tags
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {foundTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleSelectTag(tag)}
                          className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground text-left transition-colors cursor-pointer"
                        >
                          <HugeiconsIcon icon={TagsIcon} className="size-3.5 text-primary shrink-0" />
                          <span className="font-medium truncate">#{tag.name}</span>
                          {tag.category && (
                            <span className="ml-auto text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase font-semibold shrink-0">
                              {tag.category}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {foundMemes.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-t pt-2 mt-1">
                      Memes
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {foundMemes.map((meme) => (
                        <button
                          key={meme.id}
                          type="button"
                          onClick={() => handleSelectMeme(meme)}
                          className="w-full flex items-center gap-2.5 rounded-lg p-1.5 text-xs hover:bg-accent hover:text-accent-foreground text-left transition-colors cursor-pointer"
                        >
                          {/* Tiny thumbnail preview */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={meme.media_url}
                            alt={meme.title || meme.media_key}
                            className="size-8 object-cover rounded-md bg-muted shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate leading-tight">
                              {meme.title || meme.ocr_content || meme.media_key}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                              <span className="uppercase font-bold text-primary/80">
                                {meme.access_tier || "free"}
                              </span>
                              <span>•</span>
                              <span className="truncate">{meme.media_type}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-1 border rounded-lg p-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewMode("grid")}
          className={cn("size-7.5", viewMode === "grid" && "bg-muted")}
        >
          <HugeiconsIcon icon={GridViewIcon} className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewMode("list")}
          className={cn("size-7.5", viewMode === "list" && "bg-muted")}
        >
          <HugeiconsIcon icon={Menu01Icon} className="size-4" />
        </Button>
      </div>

      <ThemeToggle />
    </header>
  );
}
