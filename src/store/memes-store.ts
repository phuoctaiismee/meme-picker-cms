import { create } from "zustand";

type ViewMode = "grid" | "list";

interface MemesStore {
  searchQuery: string;
  selectedTagSlug: string | null;
  viewMode: ViewMode;
  setSearchQuery: (query: string) => void;
  setSelectedTagSlug: (slug: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useMemesStore = create<MemesStore>((set) => ({
  searchQuery: "",
  selectedTagSlug: null,
  viewMode: "grid",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedTagSlug: (selectedTagSlug) => set({ selectedTagSlug }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
