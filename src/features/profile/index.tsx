"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboard } from "@/apis/client/dashboard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserCircle02Icon,
  Mail01Icon,
  ShieldKeyIcon,
  Settings02Icon,
  Image01Icon,
  TagsIcon,
  Logout01Icon,
  InformationCircleIcon,
  Tick01Icon
} from "@hugeicons/core-free-icons";
import { signOut } from "@/lib/supabase/auth-actions";

export interface ProfileUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt?: string;
  userMetadata?: Record<string, any>;
  role?: string;
}

function getInitials(nameOrEmail?: string) {
  if (!nameOrEmail || nameOrEmail === "Chưa cập nhật") return "AD";
  if (nameOrEmail.includes("@")) {
    return nameOrEmail.split("@")[0].slice(0, 2).toUpperCase();
  }
  const words = nameOrEmail.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

export function ProfileScreen({ user }: { user?: ProfileUser }) {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboard.getStats(),
  });

  // Extract authentic user data without relying on dummy/mock defaults
  const userEmail = user?.email || "";
  const fullName = user?.userMetadata?.full_name || user?.userMetadata?.name || (userEmail ? userEmail.split('@')[0] : "Chưa cập nhật");
  const userRole = user?.role === "authenticated" ? "Administrator" : (user?.role || "Chưa cập nhật");
  const avatarUrl = user?.userMetadata?.avatar_url; // undefined if missing
  const initials = getInitials(user?.userMetadata?.full_name || user?.userMetadata?.name || userEmail);
  const department = user?.userMetadata?.department || "Chưa cập nhật";
  const formattedCreatedAt = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) 
    : "Chưa cập nhật";

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Profile Section */}
      <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 size-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

        <div className="relative group shrink-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-foreground rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
          <Avatar className="size-32 md:size-40 border-4 border-background shadow-2xl relative z-10">
            {avatarUrl && <AvatarImage src={avatarUrl} className="object-cover" />}
            <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-3 border border-primary/20">
              <HugeiconsIcon icon={ShieldKeyIcon} className="size-3" />
              {userRole}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              {fullName}
            </h1>
            <p className="text-muted-foreground mt-1 text-lg font-medium">
              Managing the digital assets of the library.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 px-4 py-2 rounded-xl border">
              <HugeiconsIcon icon={Mail01Icon} className="size-4 text-primary" />
              {userEmail || "Chưa cập nhật"}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 px-4 py-2 rounded-xl border">
              <HugeiconsIcon icon={Tick01Icon} className="size-4 text-emerald-500" />
              Account Verified
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-2xl border-muted-foreground/10 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background border shadow-xs">
                  <HugeiconsIcon icon={UserCircle02Icon} className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Account Information</CardTitle>
                  <CardDescription>Personal details and real database records.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</p>
                  <p className="text-sm font-semibold">{fullName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Email</p>
                  <p className="text-sm font-semibold">{userEmail || "Chưa cập nhật"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Access Role</p>
                  <p className="text-sm font-semibold text-primary capitalize">{userRole}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Department</p>
                  <p className="text-sm font-semibold">{department}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User ID</p>
                  <p className="text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded border truncate">
                    {user?.id || "Chưa cập nhật"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-semibold">{formattedCreatedAt}</p>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button variant="outline" size="sm" className="rounded-xl cursor-pointer">
                  <HugeiconsIcon icon={Settings02Icon} className="size-4 mr-2" />
                  Edit Account Info
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-muted-foreground/10 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background border shadow-xs">
                  <HugeiconsIcon icon={ShieldKeyIcon} className="size-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Security & Privacy</CardTitle>
                  <CardDescription>Manage your password and authentication methods.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-background border flex items-center justify-center">
                    <HugeiconsIcon icon={InformationCircleIcon} className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="rounded-xl cursor-pointer">Enable</Button>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer">
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Stats & Actions */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-muted-foreground/10 overflow-hidden shadow-sm bg-primary/5 border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Contribution</CardTitle>
              <CardDescription>Your management footprint.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-primary/10">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Image01Icon} className="size-4 text-primary" />
                  <span className="text-xs font-semibold">Total Memes</span>
                </div>
                <span className="text-lg font-black">{stats?.totalMemes || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-primary/10">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={TagsIcon} className="size-4 text-purple-500" />
                  <span className="text-xs font-semibold">Active Tags</span>
                </div>
                <span className="text-lg font-black">{stats?.totalTags || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-muted-foreground/10 overflow-hidden shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Quick Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-xs font-bold gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                <HugeiconsIcon icon={InformationCircleIcon} className="size-4" />
                CMS Documentation
              </Button>
              <Button variant="ghost" className="w-full justify-start text-xs font-bold gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                <HugeiconsIcon icon={Settings02Icon} className="size-4" />
                Support Ticket
              </Button>
            </CardContent>
          </Card>

          <form action={signOut} className="pt-4">
            <Button
              type="submit"
              variant="destructive"
              className="w-full rounded-2xl py-6 font-bold shadow-lg shadow-red-500/10 cursor-pointer"
            >
              <HugeiconsIcon icon={Logout01Icon} className="size-5 mr-2" />
              Secure Log Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
