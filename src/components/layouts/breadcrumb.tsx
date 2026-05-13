"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MemeBreadcrumb() {
  const pathname = usePathname();
  const current =
    pathname === "/create"
      ? "Create Meme"
      : pathname === "/tags"
        ? "Tags"
        : pathname === "/interactions"
          ? "Interactions"
        : "All Memes";

  return (
    <nav className="flex items-center gap-2 text-sm min-w-0">
      <Link href="/" className="font-medium text-muted-foreground hover:text-foreground">
        Meme CMS
      </Link>
      <span className="text-muted-foreground">/</span>
      <span className="font-medium truncate">{current}</span>
    </nav>
  );
}
