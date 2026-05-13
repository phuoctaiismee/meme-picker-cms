import type { Meme } from "@/apis/interfaces/memes";
import type { MemeTag } from "@/apis/interfaces/tags";

export interface DashboardStats {
  totalMemes: number;
  totalTags: number;
  totalInteractions: number;
  activeMemes: number;
  trendingMemes: (Meme & { interaction_count: number })[];
  trendingTags: (MemeTag & { usage_count: number })[];
  interactionHistory: { date: string; count: number }[];
}

export const dashboard = {
  async getStats(): Promise<DashboardStats> {
    const response = await fetch("/api/dashboard/stats");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load dashboard stats.");
    }

    return data;
  }
};
