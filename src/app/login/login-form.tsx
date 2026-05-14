"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithCredentials } from "@/lib/supabase/auth-actions";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

interface LoginFormProps {
  isConfigured: boolean;
  isDevelopment: boolean;
}

export function LoginForm({ isConfigured, isDevelopment }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await signInWithCredentials(formData);
      if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
    onError: (err: any) => {
      setError(err.message || "Failed to sign in.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(new FormData(e.currentTarget));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
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
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
          <HugeiconsIcon icon={InformationCircleIcon} className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="example@gmail.com"
            defaultValue={isDevelopment ? "admin@example.com" : ""}
            required
            disabled={mutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            defaultValue={isDevelopment ? "123456" : ""}
            required
            disabled={mutation.isPending}
          />
        </div>
      </div>

      <Button type="submit" className="mt-6 w-full" disabled={!isConfigured || mutation.isPending}>
        {mutation.isPending ? (
          <>
            <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
