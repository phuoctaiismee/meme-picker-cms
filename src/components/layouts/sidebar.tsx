"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  DashboardCircleIcon,
  Image01Icon,
  Logout01Icon,
  TagsIcon,
  UserCircle02Icon,
  Activity01Icon,
  Activity03FreeIcons,
} from "@hugeicons/core-free-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/supabase/auth-actions";
import Image from "next/image";

const menuItems = [
  { icon: DashboardCircleIcon, label: "Dashboard", href: "/" },
  { icon: Image01Icon, label: "Meme Library", href: "/memes" },
  { icon: TagsIcon, label: "Tags", href: "/tags" },
  { icon: Activity01Icon, label: "Interactions", href: "/interactions" },
];

export function MemesSidebar({
  userEmail,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userEmail?: string;
}) {
  const pathname = usePathname();

  return (
    <Sidebar className="lg:border-r-0!" collapsible="offExamples" {...props}>
      <SidebarHeader className="p-4 pb-0">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 relative items-center justify-center rounded-md overflow-hidden">
            <Image src="/meo-huh.gif" alt="Logo" fill className="object-contain" />
          </div>
          <span className="font-semibold text-base">CMS</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 pt-6">
        <Button render={<Link href="/create" />} className="w-full mb-4 gap-2">
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          Create Meme
        </Button>
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    className="h-9"
                  >
                    <HugeiconsIcon icon={item.icon} className="size-4" />
                    <span className="text-sm">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-0 mt-6">
          <div className="flex items-center gap-1 px-2 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <HugeiconsIcon icon={TagsIcon} className="size-3" />
            <span>Tags power filtering</span>
          </div>
          <p className="px-2 text-xs text-muted-foreground">
            Tags are saved in Supabase and attached through meme_tags.
          </p>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                className="flex w-full items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors text-left"
              >
                <Avatar className="size-8">
                  <AvatarImage src="/ln.png" />
                  <AvatarFallback className="text-xs">
                    {userEmail?.slice(0, 2).toUpperCase() ?? "AD"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Admin</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userEmail}
                  </p>
                </div>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <HugeiconsIcon
                  icon={UserCircle02Icon}
                  className="size-4 mr-2"
                />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem
                render={<button type="submit" className="w-full" />}
                variant="destructive"
              >
                <HugeiconsIcon icon={Logout01Icon} className="size-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
