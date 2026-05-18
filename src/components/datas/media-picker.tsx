"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Image01Icon, 
  Upload01Icon, 
  Search01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  LibraryIcon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

interface MediaAsset {
  key: string;
  secureUrl: string;
  mediaType: "image";
}

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: { key: string; url: string; file?: File }) => void;
}

async function fetchMediaAssets() {
  const response = await fetch("/api/media");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch media");
  return (data.resources || []) as MediaAsset[];
}

export function MediaPicker({ open, onOpenChange, onSelect }: MediaPickerProps) {
  const [tab, setTab] = React.useState("gallery");
  const [search, setSearch] = React.useState("");
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = React.useState<string | null>(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["media-assets"],
    queryFn: fetchMediaAssets,
    enabled: open && tab === "gallery",
  });

  const filteredAssets = assets.filter(asset => 
    asset.key.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = () => {
    if (tab === "gallery" && selectedKey) {
      const asset = assets.find(a => a.key === selectedKey);
      if (asset) {
        onSelect({ key: asset.key, url: asset.secureUrl });
        onOpenChange(false);
      }
    } else if (tab === "upload" && uploadFile && uploadPreview) {
      onSelect({ key: "new", url: uploadPreview, file: uploadFile });
      onOpenChange(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden flex flex-col max-h-[85vh] gap-0 border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 border-b bg-background flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <HugeiconsIcon icon={LibraryIcon} className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Media Library</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Select from storage or upload new</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <TabsList className="bg-muted/50 border shadow-sm">
                <TabsTrigger value="gallery" className="gap-2 px-4 py-2">
                  <HugeiconsIcon icon={Image01Icon} className="size-4" />
                  Gallery
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2 px-4 py-2">
                  <HugeiconsIcon icon={Upload01Icon} className="size-4" />
                  Upload
                </TabsTrigger>
              </TabsList>

              {tab === "gallery" && (
                <div className="relative group max-w-xs w-full">
                  <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search files..." 
                    className="pl-9 h-10 rounded-xl bg-muted/30 border-muted-foreground/10 focus:bg-background transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              )}
            </div>

            <TabsContent value="gallery" className="mt-0 h-[400px] overflow-y-auto no-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                  <HugeiconsIcon icon={Loading03Icon} className="size-8 animate-spin text-primary" />
                  <p className="text-sm font-medium animate-pulse">Syncing storage assets...</p>
                </div>
              ) : filteredAssets.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-1">
                  {filteredAssets.map((asset) => (
                    <div 
                      key={asset.key}
                      onClick={() => setSelectedKey(asset.key)}
                      className={cn(
                        "relative aspect-square rounded-xl border-2 transition-all cursor-pointer group overflow-hidden",
                        selectedKey === asset.key 
                          ? "dark:border-white border-black" 
                          : "border-transparent"
                      )}
                    >
                      <Image 
                        src={asset.secureUrl} 
                        alt={asset.key} 
                        fill 
                        className="object-cover" 
                        sizes="(max-width: 768px) 50vw, 200px"
                      />
                      {selectedKey === asset.key && (
                        <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-0.5 shadow-lg animate-in zoom-in duration-200">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] text-white truncate font-medium">{asset.key}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
                  <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <HugeiconsIcon icon={Image01Icon} className="size-8 opacity-20" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No media found</p>
                  <p className="text-xs">Your storage seems to be empty or search has no results.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="mt-0 h-[400px]">
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-3xl bg-muted/5 hover:bg-muted/10 hover:border-primary/40 transition-all group relative overflow-hidden">
                {uploadPreview ? (
                  <div className="relative w-full h-full p-4 flex flex-col items-center justify-center gap-4 bg-muted/10">
                    <div className="relative w-full max-w-sm aspect-video rounded-2xl border shadow-2xl overflow-hidden bg-background">
                      <Image src={uploadPreview} alt="Preview" fill className="object-contain" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl px-4 h-9"
                        onClick={() => {
                          setUploadFile(null);
                          setUploadPreview(null);
                        }}
                      >
                        Reset
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-xl px-4 h-9 font-bold"
                        onClick={() => document.getElementById("media-upload-input")?.click()}
                      >
                        Choose Different
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium truncate max-w-xs">{uploadFile?.name}</p>
                  </div>
                ) : (
                  <div 
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => document.getElementById("media-upload-input")?.click()}
                  >
                    <div className="size-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 transition-all duration-300 shadow-sm border border-primary/20 group-hover:ring-4 group-hover:ring-primary/5">
                      <HugeiconsIcon icon={Upload01Icon} className="size-10" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Click to upload image</h3>
                    <p className="text-xs text-muted-foreground mt-2">Supports JPG, PNG, GIF, WebP (Max 10MB)</p>
                  </div>
                )}
                <input 
                  id="media-upload-input" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10 flex-row items-center justify-end gap-3 sm:space-x-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl px-6 font-medium">
            Cancel
          </Button>
          <Button 
            className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20 h-10"
            disabled={tab === "gallery" ? !selectedKey : !uploadFile}
            onClick={handleSelect}
          >
            Apply Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
