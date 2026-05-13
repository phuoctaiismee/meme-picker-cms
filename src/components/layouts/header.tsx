"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GridViewIcon,
  Menu01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useMemesStore } from "@/store/memes-store";
import { MemeBreadcrumb } from "./breadcrumb";

export function MemesHeader() {
  const { searchQuery, setSearchQuery, viewMode, setViewMode } =
    useMemesStore();

  return (
    <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 border-b bg-card sticky top-0 z-10 w-full">
      <SidebarTrigger className="-ml-1 sm:-ml-2" />

      <div className="min-w-0">
        <MemeBreadcrumb />
      </div>

      <div className="hidden md:block relative ml-auto w-full max-w-xs">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <Input
          placeholder="Search memes or tags..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="pl-9 h-9 bg-card border"
        />
      </div>

      <div className="hidden sm:flex items-center gap-1 border rounded-lg p-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewMode("grid")}
          className={cn("size-7.5", viewMode === "grid" && "bg-muted")}
        >
          <HugeiconsIcon icon={GridViewIcon} className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewMode("list")}
          className={cn("size-7.5", viewMode === "list" && "bg-muted")}
        >
          <HugeiconsIcon icon={Menu01Icon} className="size-4" />
        </Button>
      </div>



      <ThemeToggle />
    </header>
  );
}
