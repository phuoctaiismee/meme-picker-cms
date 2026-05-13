import { redirect } from "next/navigation";
import { MemesHeader } from "@/components/layouts/header";
import { MemesSidebar } from "@/components/layouts/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MemesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const meta = user.user_metadata || {};
  const userName = meta.full_name || meta.name;
  const avatarUrl = meta.avatar_url;

  return (
    <SidebarProvider className="bg-sidebar">
      <MemesSidebar 
        userEmail={user.email} 
        userName={userName}
        avatarUrl={avatarUrl}
      />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-xl overflow-hidden flex flex-col items-center justify-start h-full w-full bg-background">
          <MemesHeader />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
