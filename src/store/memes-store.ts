import { create } from "zustand";
import type { Meme } from "@/apis/interfaces/memes";

type ViewMode = "grid" | "list";

interface MemesStore {
  searchQuery: string;
  selectedTagSlugs: string[];
  viewMode: ViewMode;
  editingMeme: Meme | null;
  setSearchQuery: (query: string) => void;
  toggleSelectedTagSlug: (slug: string) => void;
  resetSelectedTagSlugs: () => void;
  setViewMode: (mode: ViewMode) => void;
  setEditingMeme: (meme: Meme | null) => void;
}

export const useMemesStore = create<MemesStore>((set) => ({
  searchQuery: "",
  selectedTagSlugs: [],
  viewMode: "grid",
  editingMeme: null,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleSelectedTagSlug: (slug) =>
    set((state) => ({
      selectedTagSlugs: state.selectedTagSlugs.includes(slug)
        ? state.selectedTagSlugs.filter((s) => s !== slug)
        : [...state.selectedTagSlugs, slug],
    })),
  resetSelectedTagSlugs: () => set({ selectedTagSlugs: [] }),
  setViewMode: (viewMode) => set({ viewMode }),
  setEditingMeme: (editingMeme) => set({ editingMeme }),
}));
