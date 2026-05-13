"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface AnalyticsChartProps {
  data: { date: string; count: number }[];
  isLoading?: boolean;
}

export function AnalyticsChart({ data, isLoading }: AnalyticsChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-sm h-[400px] flex items-center justify-center">
        <div className="space-y-4 w-full">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-[280px] w-full bg-muted/50 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold tracking-tight">Interaction Trends</h3>
        <p className="text-sm text-muted-foreground">Daily user interactions over the last 7 days</p>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              dy={10}
              tickFormatter={(str) => {
                const date = new Date(str);
                return date.toLocaleDateString("en", { weekday: "short" });
              }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "var(--card)", 
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontSize: "12px"
              }}
              cursor={{ stroke: "var(--primary)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCount)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
