"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { useAISuggestion } from "./hooks/use-ai-suggestion";
import { SuggestionInput } from "./components/suggestion-input";
import { SuggestionResults } from "./components/suggestion-results";

export function AISuggestionScreen() {
  const { memes, isLoading, error, suggest } = useAISuggestion();

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-8 w-full max-w-6xl mx-auto space-y-6">
      {/* Header chuẩn BaseUI */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <HugeiconsIcon icon={SparklesIcon} className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Suggestion Lab</h1>
            <p className="text-xs text-muted-foreground">Find the perfect memes using context analysis</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-12 space-y-6">
          <SuggestionInput onSuggest={suggest} isLoading={isLoading} />
          
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <SuggestionResults memes={memes} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
