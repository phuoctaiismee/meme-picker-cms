import { redirect } from "next/navigation";
import { getCurrentUser, hasSupabaseEnv } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  const isDevelopment = process.env.NODE_ENV === "development";

  if (user) {
    redirect("/");
  }

  const isConfigured = hasSupabaseEnv();

  return (
    <main className="min-h-svh bg-background flex items-center justify-center p-4">
      <LoginForm isConfigured={isConfigured} isDevelopment={isDevelopment} />
    </main>
  );
}
