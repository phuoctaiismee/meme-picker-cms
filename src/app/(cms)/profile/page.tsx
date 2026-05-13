import { redirect } from "next/navigation";
import { ProfileScreen } from "@/features/profile";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex-1 overflow-auto w-full">
      <ProfileScreen
        user={{
          id: user.id,
          email: user.email ?? "",
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at ?? user.created_at,
          userMetadata: user.user_metadata ?? {},
          role: user.role ?? "authenticated",
        }}
      />
    </main>
  );
}
