"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PaginationProps {
  pageCount: number;
  currentPage: number; // 0-indexed
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ pageCount, currentPage, onPageChange, disabled }: PaginationProps) {
  const paginationRange = React.useMemo(() => {
    const totalPageNumbers = 7;
    
    if (pageCount <= totalPageNumbers) {
      return Array.from({ length: pageCount }, (_, i) => i);
    }

    const leftSiblingIndex = Math.max(currentPage - 1, 0);
    const rightSiblingIndex = Math.min(currentPage + 1, pageCount - 1);

    const shouldShowLeftDots = leftSiblingIndex > 1;
    const shouldShowRightDots = rightSiblingIndex < pageCount - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 5;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i);
      return [...leftRange, "dots", pageCount - 1];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 5;
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => pageCount - rightItemCount + i);
      return [0, "dots", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from({ length: 3 }, (_, i) => leftSiblingIndex + i);
      return [0, "dots", ...middleRange, "dots", pageCount - 1];
    }
    
    return [];
  }, [pageCount, currentPage]);

  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0 || disabled}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
      </Button>

      {paginationRange.map((page, index) => {
        if (page === "dots") {
          return (
            <div key={`dots-${index}`} className="flex h-8 w-8 items-center justify-center">
              <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        }

        const pageNum = (page as number) + 1;
        const isActive = currentPage === page;

        return (
          <Button
            key={`page-${page}`}
            variant={isActive ? "default" : "outline"}
            size="icon"
            className="h-8 w-8 text-xs"
            onClick={() => onPageChange(page as number)}
            disabled={disabled}
          >
            {pageNum}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pageCount - 1 || disabled}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
      </Button>
    </div>
  );
}
