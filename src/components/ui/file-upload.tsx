"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CloudUploadIcon, Cancel01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  id?: string;
  name?: string;
  accept?: string;
  maxSize?: number; // in bytes
  value?: File | null;
  onChange?: (file: File | null) => void;
  className?: string;
  required?: boolean;
}

export function FileUpload({
  id,
  name,
  accept,
  maxSize = 10 * 1024 * 1024,
  value,
  onChange,
  className,
  required,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [localFile, setLocalFile] = React.useState<File | null>(value || null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = React.useCallback(
    (file: File) => {
      setError(null);

      if (maxSize && file.size > maxSize) {
        setError(`File is too large. Max size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
        return;
      }

      setLocalFile(file);
      onChange?.(file);
    },
    [maxSize, onChange]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onChange?.(null);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative group cursor-pointer rounded-xl border-2 border-dashed transition-all hover:bg-muted/50 flex flex-col items-center justify-center p-8 min-h-[160px] outline-none focus-within:ring-2 focus-within:ring-primary/50",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 bg-muted/30",
          localFile ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20",
          error && "border-destructive/50 bg-destructive/5"
        )}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          className="sr-only"
          accept={accept}
          required={required && !localFile}
          onChange={handleChange}
        />

        <div className="size-12 rounded-full bg-background border flex items-center justify-center mb-3 shadow-sm">
          <HugeiconsIcon
            icon={CloudUploadIcon}
            className={cn("size-6", localFile ? "text-primary" : "text-muted-foreground")}
          />
        </div>

        {localFile ? (
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-primary truncate max-w-[300px]">
              {localFile.name}
            </p>
            <button
              type="button"
              onClick={clearFile}
              className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 mx-auto"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
              Remove
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium">Click to upload or drag & drop</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports {(() => {
                if (!accept) return "Any file";
                const parts = accept.split(",");
                const formatted: string[] = [];
                let hasImages = false;
                let hasVideos = false;
                parts.forEach(p => {
                  const trimmed = p.trim().toLowerCase();
                  if (trimmed === "image/*") hasImages = true;
                  else if (trimmed === "video/*") hasVideos = true;
                  else formatted.push(trimmed.replace(/^\./, "").toUpperCase());
                });
                if (hasImages && hasVideos) return "PNG, JPG, GIF, MP4, WebM";
                if (hasImages) return "PNG, JPG, GIF";
                if (hasVideos) return "MP4, WebM";
                return formatted.join(", ");
              })()} up to {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <HugeiconsIcon icon={InformationCircleIcon} className="size-3" />
          {error}
        </p>
      )}
    </div>
  );
}
