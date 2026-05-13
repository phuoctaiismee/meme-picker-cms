import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";

export default function DashboardPage() {
  return (
    <main className="flex-1 overflow-auto w-full p-6">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time insights and performance metrics.</p>
        </div>
        <DashboardScreen />
      </div>
    </main>
  );
}
