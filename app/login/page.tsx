import { redirect } from "next/navigation";
import { signIn } from "@/lib/supabase/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser, hasSupabaseEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const isDevelopment = process.env.NODE_ENV === "development";


  if (user) {
    redirect("/");
  }

  const { error } = await searchParams;
  const isConfigured = hasSupabaseEnv();

  return (
    <main className="min-h-svh bg-background flex items-center justify-center p-4">
      <form action={signIn} className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Meme Picker CMS</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with a Supabase admin account.
          </p>
        </div>

        {!isConfigured && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            to enable sign in.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input id="email" name="email" type="email" placeholder="example@gmail.com" defaultValue={isDevelopment && 'admin@example.com' || ''} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input id="password" name="password" type="password" placeholder="••••••••" defaultValue={isDevelopment && '123456' || ''} required />
          </div>
        </div>

        <Button type="submit" className="mt-6 w-full" disabled={!isConfigured}>
          Sign in
        </Button>
      </form>
    </main>
  );
}
