"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon, Loading03Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { MemeCard } from "@/features/memes/components/meme-card";
import type { Meme } from "@/apis/interfaces/memes";
import { Skeleton } from "@/components/ui/skeleton";

interface SuggestionResultsProps {
  memes: Meme[];
  isLoading: boolean;
}

export function SuggestionResults({ memes, isLoading }: SuggestionResultsProps) {
  if (isLoading && memes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <HugeiconsIcon icon={SparklesIcon} className="size-4 text-primary animate-pulse" />
          <h2 className="text-sm font-semibold">Generating Suggestions...</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 space-y-4 shadow-sm">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-20 text-center shadow-sm">
        <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <HugeiconsIcon icon={Image01Icon} className="size-7 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-xl mb-1 text-foreground">No suggestions yet</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Enter your content above and let our AI help you find the most relevant memes for your post.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Recommended Memes</h2>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Found {memes.length} matches
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/40 z-20 flex items-center justify-center backdrop-blur-[2px] rounded-2xl">
            <HugeiconsIcon icon={Loading03Icon} className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}
        {memes.map((meme) => (
          <MemeCard 
            key={meme.id} 
            meme={meme}
            // Add empty handlers or logic if needed, but for suggestion, maybe viewing is enough
            onEdit={() => {}} 
            onDelete={() => {}}
            onToggleStatus={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
