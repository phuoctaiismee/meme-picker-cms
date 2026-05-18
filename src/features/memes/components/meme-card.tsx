import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Image01Icon,
  MoreVerticalIcon,
  Activity01Icon,
  ViewIcon,
  ViewOffIcon,
  Alert01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMemesStore } from "@/store/memes-store";
import type { Meme } from "@/apis/interfaces/memes";
import { Checkbox } from "@/components/ui/checkbox";

interface MemeCardProps {
  meme: Meme;
  onEdit: (meme: Meme) => void;
  onToggleStatus: (meme: Meme, isActive: boolean) => void;
  onDelete: (meme: Meme) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  isSelectionEnabled?: boolean;
}

const tagColors = [
  "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
  "bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20",
  "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20",
  "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20",
  "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20",
  "bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20",
  "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20",
];

function getTagColorClass(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tagColors[Math.abs(hash) % tagColors.length];
}

function getTierBadgeClass(tier: string | null) {
  const t = (tier || "free").toLowerCase();
  if (t === "premium") return "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-black shadow-sm";
  if (t === "pro") return "bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white font-black shadow-sm";
  if (t === "basic" || t === "standard") return "bg-blue-600 text-white";
  return "bg-emerald-600 text-white";
}

export function MemeCard({
  meme,
  onEdit,
  onToggleStatus,
  onDelete,
  isSelected,
  onSelect,
  isSelectionEnabled,
}: MemeCardProps) {
  const { toggleSelectedTagSlug } = useMemesStore();

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border p-1.5 bg-card overflow-hidden transition-all duration-200 hover:bg-muted/50 shadow-xs cursor-pointer",
        !meme.is_active && "opacity-80 grayscale-[0.3]",
        isSelected && "ring-1 ring-primary border-primary bg-primary/5"
      )}
      onClick={() => onSelect?.()}
    >
      {/* Selection Checkbox */}
      {isSelectionEnabled && (
        <div className={cn(
          "absolute top-3 left-3 z-30 transition-all duration-200",
          isSelected ? "opacity-100 scale-100" : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
        )}>
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onSelect}
          />
        </div>
      )}
      {/* Media Area */}
      <div className="aspect-4/3 bg-muted relative overflow-hidden rounded-xl">
        {meme.media_type === "video" ? (
          <video
            src={meme.media_url}
            className="size-full object-cover"
            muted
            loop
            playsInline
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
            onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
          />
        ) : (
          <Image
            src={meme.media_url}
            alt={meme.title || meme.ocr_content || meme.media_key}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            unoptimized={meme.media_url.toLowerCase().includes(".gif") || meme.media_key.toLowerCase().includes(".gif")}
          />
        )}

        {/* Top Left: Tier Badge & Inactive Status */}
        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1.5 pointer-events-none">
          <div className={cn("px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider shadow-sm", getTierBadgeClass(meme.access_tier))}>
            {meme.access_tier || "free"}
          </div>
          {!meme.is_active && (
            <div className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-orange-500 text-white shadow-sm">
              Inactive
            </div>
          )}
        </div>

        {/* Top Right: More Actions Dropdown */}
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="secondary"
                  size="icon-xs"
                  className="size-7 rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} className="size-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-40 p-1 rounded-lg shadow-xl border-muted-foreground/10">
              <DropdownMenuGroup className="space-y-0.5">
                <DropdownMenuItem
                  className="gap-1.5 cursor-pointer text-xs"
                  onClick={() => window.open(meme.media_url, "_blank")}
                >
                  <HugeiconsIcon icon={Image01Icon} className="size-3.5" /> Preview Media
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-1.5 cursor-pointer text-xs"
                  onClick={() => onEdit(meme)}
                >
                  <HugeiconsIcon icon={Activity01Icon} className="size-3.5" /> Edit Details
                </DropdownMenuItem>
                {!meme.is_active && (
                  <DropdownMenuItem
                    className="gap-1.5 cursor-pointer text-xs"
                    onClick={() => onToggleStatus(meme, true)}
                  >
                    <HugeiconsIcon icon={ViewIcon} className="size-3.5 text-emerald-500" />
                    Restore
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-0.5 opacity-50" />
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-1.5 cursor-pointer text-xs"
                  onClick={() => onDelete(meme)}
                >
                  <HugeiconsIcon icon={Alert01Icon} className="size-3.5" /> 
                  {meme.is_active ? "Delete" : "Delete Permanently"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-2 flex-1 flex flex-col justify-between gap-2.5 mt-1">
        <h4 className="font-semibold text-sm truncate leading-snug text-foreground/95 group-hover:text-primary transition-colors">
          {meme.title || "Untitled Meme"}
        </h4>

        {/* Tags Area */}
        <div className="flex flex-wrap gap-1.5 overflow-hidden items-center pt-0.5">
          {meme.tags.slice(0, 3).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSelectedTagSlug(tag.slug);
              }}
              className={cn("px-2 py-0.5 rounded-sm text-[10px] transition-all", getTagColorClass(tag.slug))}
            >
              #{tag.name}
            </button>
          ))}
          {meme.tags.length > 3 && (
            <span className="text-[10px] font-extrabold text-muted-foreground/60 pl-0.5">
              +{meme.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
