"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboard } from "@/apis/client/dashboard";
import { StatsCards } from "./stats-cards";
import { AnalyticsChart } from "./analytics-chart";
import { TrendingList } from "./trending-list";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function DashboardScreen() {
  const { data: stats, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboard.getStats(),
  });

  const defaultStats = {
    totalMemes: 0,
    totalTags: 0,
    totalInteractions: 0,
    activeMemes: 0,
    trendingMemes: [],
    trendingTags: [],
    interactionHistory: [],
  };

  const currentStats = stats ?? defaultStats;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Real-time performance metrics and insights.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="rounded-xl"
        >
          <HugeiconsIcon 
            icon={RefreshIcon} 
            className={`size-4 mr-2 ${isFetching ? "animate-spin" : ""}`} 
          />
          Refresh
        </Button>
      </div>

      <StatsCards stats={currentStats} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-6">
         <AnalyticsChart data={currentStats.interactionHistory} isLoading={isLoading} />
         <TrendingList 
           memes={currentStats.trendingMemes} 
           tags={currentStats.trendingTags} 
           isLoading={isLoading} 
         />
      </div>
    </div>
  );
}
