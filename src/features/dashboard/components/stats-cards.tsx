"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Image01Icon, 
  Tag01Icon, 
  Pulse02Icon, 
  CheckListIcon 
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalMemes: number;
    totalTags: number;
    totalInteractions: number;
    activeMemes: number;
  };
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Memes",
      value: stats.totalMemes.toLocaleString(),
      description: `${stats.activeMemes} active memes`,
      icon: Image01Icon,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Tags",
      value: stats.totalTags.toLocaleString(),
      description: "Across all categories",
      icon: Tag01Icon,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Interactions",
      value: stats.totalInteractions.toLocaleString(),
      description: "Media opens & copies",
      icon: Pulse02Icon,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      label: "Active Status",
      value: `${((stats.activeMemes / (stats.totalMemes || 1)) * 100).toFixed(1)}%`,
      description: "Availability rate",
      icon: CheckListIcon,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="rounded-2xl border bg-card p-6 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">{card.label}</div>
            <div className="text-2xl font-bold tracking-tight min-h-[32px] flex items-center">
              {isLoading ? <div className="h-8 w-16 bg-muted animate-pulse rounded" /> : card.value}
            </div>
            <div className="text-xs text-muted-foreground min-h-[16px] flex items-center">
              {isLoading ? <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1" /> : card.description}
            </div>
          </div>
          <div className={cn("p-2.5 rounded-xl", card.bg)}>
            <HugeiconsIcon icon={card.icon} className={cn("size-5", card.color)} />
          </div>
        </div>
      ))}
    </div>
  );
}
