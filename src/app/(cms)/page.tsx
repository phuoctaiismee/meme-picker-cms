import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";

export default function DashboardPage() {
  return (
    <main className="flex-1 overflow-auto w-full p-6">
      <div className="max-w-[1600px] mx-auto">
        <DashboardScreen />
      </div>
    </main>
  );
}
