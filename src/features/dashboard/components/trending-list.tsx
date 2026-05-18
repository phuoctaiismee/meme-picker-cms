"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { 
  FireIcon, 
  Tag01Icon, 
  ArrowRight01Icon,
  Image01Icon
} from "@hugeicons/core-free-icons";
import type { Meme } from "@/apis/interfaces/memes";
import type { MemeTag } from "@/apis/interfaces/tags";
import Image from "next/image";

interface TrendingListProps {
  memes: (Meme & { interaction_count: number })[];
  tags: (MemeTag & { usage_count: number })[];
  isLoading?: boolean;
}

// Simple Badge component since I'm not sure if ui/badge.tsx exists
function LocalBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>
      {children}
    </span>
  );
}

export function TrendingList({ memes, tags, isLoading }: TrendingListProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trending Memes */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
              <HugeiconsIcon icon={FireIcon} className="size-4" />
            </div>
            <h3 className="font-semibold tracking-tight">Trending Memes</h3>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Most Interacted</p>
        </div>
        
        <div className="flex-1 divide-y">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                <div className="size-12 rounded-lg bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : memes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
               <HugeiconsIcon icon={Image01Icon} className="size-8 opacity-20 mb-3" />
               <p className="text-sm">No trending data yet</p>
            </div>
          ) : (
            memes.map((meme) => (
              <div key={meme.id} className="p-4 flex items-center gap-4 group hover:bg-muted/30 transition-colors">
                <div className="size-12 rounded-lg bg-muted shrink-0 overflow-hidden relative border shadow-sm">
                  <Image 
                    src={meme.media_url} 
                    alt={meme.title || meme.media_key} 
                    fill 
                    className="object-cover"
                    sizes="48px"
                    unoptimized={meme.media_url.toLowerCase().includes(".gif") || meme.media_key.toLowerCase().includes(".gif")}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {meme.title || meme.media_key}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {meme.interaction_count} interactions
                  </p>
                </div>
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trending Tags */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <HugeiconsIcon icon={Tag01Icon} className="size-4" />
            </div>
            <h3 className="font-semibold tracking-tight">Top Tags</h3>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Usage Frequency</p>
        </div>

        <div className="flex-1 divide-y">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                <div className="size-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : tags.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
               <HugeiconsIcon icon={Tag01Icon} className="size-8 opacity-20 mb-3" />
               <p className="text-sm">No tag data yet</p>
            </div>
          ) : (
            tags.map((tag) => (
              <div key={tag.id} className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary/5 flex items-center justify-center border text-[10px] font-bold text-primary">
                    #
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {tag.name}
                  </span>
                </div>
                <LocalBadge className="bg-primary/5 text-primary ring-primary/20">
                  {tag.usage_count} memes
                </LocalBadge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
