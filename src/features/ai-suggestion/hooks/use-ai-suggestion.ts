import { useMutation } from "@tanstack/react-query";
import type { Meme } from "@/apis/interfaces/memes";

async function fetchSuggestions(context: string): Promise<Meme[]> {
  const response = await fetch("/api/suggest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ context }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get suggestions");
  }

  return response.json();
}

export function useAISuggestion() {
  const mutation = useMutation({
    mutationFn: (context: string) => fetchSuggestions(context),
  });

  return {
    memes: mutation.data ?? [],
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    suggest: (context: string) => mutation.mutate(context),
    clearError: () => mutation.reset(),
  };
}
