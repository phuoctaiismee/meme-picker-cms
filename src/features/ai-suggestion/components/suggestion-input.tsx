"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, SentIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface SuggestionInputProps {
  onSuggest: (context: string) => void;
  isLoading: boolean;
}

export function SuggestionInput({ onSuggest, isLoading }: SuggestionInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuggest(value);
  };

  return (
    <div className="bg-card rounded-2xl border shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
            Post Content / Context
          </label>
          <div className="relative group">
            <textarea
              className="w-full min-h-[140px] p-4 rounded-xl border bg-muted/20 focus:bg-background focus:ring-1 focus:ring-primary/30 outline-none transition-all resize-none text-sm leading-relaxed"
              placeholder="Paste the caption, post content or describe the context here..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isLoading}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-medium">
                {value.length} characters
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-muted/30">
          <div />
          <Button 
            type="submit" 
            disabled={isLoading || !value.trim()}
            className="gap-2 rounded-xl h-10 px-6 font-semibold shadow-sm"
          >
            {isLoading ? (
              <span className="animate-spin size-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <HugeiconsIcon icon={SparklesIcon} className="size-4" />
            )}
            {isLoading ? "Analyzing..." : "Get AI Suggestion"}
          </Button>
        </div>
      </form>
    </div>
  );
}
