"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  FileDownloadIcon, 
  Upload01Icon, 
  Loading03Icon, 
  CheckmarkCircle02Icon, 
  CancelCircleIcon,
  Image01Icon,
  FileImportIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  InformationCircleIcon,
  Edit01Icon,
  PlusSignIcon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseTags } from "@/lib/slug";
import { revalidatePathAction, createMemeBulkItemAction } from "@/features/memes/actions";
import { cn } from "@/lib/utils";

interface ImportRecord {
  id: string;
  filename: string;
  title: string;
  tags: string;
  ocr_content: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  matchedFile?: File;
  progress?: number;
}

export function BulkImportModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [records, setRecords] = React.useState<ImportRecord[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [totalProgress, setTotalProgress] = React.useState(0);
  const [excelFileName, setExcelFileName] = React.useState<string | null>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { filename: "meme1.jpg", title: "Meme Title 1", tags: "tag1, tag2", ocr_content: "text in meme 1" },
      { filename: "meme2.png", title: "Meme Title 2", tags: "funny, cat", ocr_content: "text in meme 2" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Memes");
    XLSX.writeFile(wb, "meme_import_template.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const newRecords = data.map((row, index) => ({
        id: `row-${index}`,
        filename: String(row.filename || ""),
        title: String(row.title || ""),
        tags: String(row.tags || ""),
        ocr_content: String(row.ocr_content || ""),
        status: "pending" as const,
        progress: 0,
      }));
      setRecords(newRecords);
      setStep(2);
    };
    reader.readAsBinaryString(file);
  };

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => {
        const newFiles = [...prev];
        files.forEach(f => {
          if (!newFiles.find(nf => nf.name === f.name)) {
            newFiles.push(f);
          }
        });
        return newFiles;
      });
      
      setRecords(prev => prev.map(record => {
        if (record.matchedFile) return record;
        const match = files.find(f => f.name === record.filename);
        return match ? { ...record, matchedFile: match, status: "pending" as const } : record;
      }));
    }
  };

  const pickFileForRecord = (recordId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setRecords(prev => prev.map(r => 
          r.id === recordId ? { ...r, matchedFile: file, status: "pending" as const } : r
        ));
      }
    };
    input.click();
  };

  const startImport = async () => {
    setIsProcessing(true);
    setTotalProgress(0);

    const updatedRecords = [...records];
    let successCount = 0;

    for (let i = 0; i < updatedRecords.length; i++) {
      const record = updatedRecords[i];
      if (record.status === "success") {
        successCount++;
        continue;
      }
      
      const file = record.matchedFile;
      if (!file) {
        updatedRecords[i] = { ...record, status: "error", error: "No file" };
        setRecords([...updatedRecords]);
        continue;
      }

      try {
        updatedRecords[i] = { ...record, status: "uploading", progress: 5 };
        setRecords([...updatedRecords]);
        
        // High-frequency interval for ultra-smooth progress (every 50ms)
        const interval = setInterval(() => {
          setRecords(prev => prev.map(r => {
            if (r.id === record.id && r.status === "uploading" && (r.progress || 0) < 95) {
              // Slow down as it approaches 95%
              const current = r.progress || 0;
              const increment = current < 60 ? 2 : current < 85 ? 0.5 : 0.1;
              return { ...r, progress: Math.min(95, current + increment) };
            }
            return r;
          }));
        }, 50);

        await createMemeBulkItemAction({
          file,
          title: record.title,
          tags: parseTags(record.tags),
          ocr_content: record.ocr_content,
        });

        clearInterval(interval);
        updatedRecords[i] = { ...record, status: "success", progress: 100 };
        successCount++;
      } catch (err: any) {
        updatedRecords[i] = { ...record, status: "error", error: err.message, progress: 0 };
      }

      setRecords([...updatedRecords]);
      setTotalProgress(Math.round(((i + 1) / updatedRecords.length) * 100));
    }

    setIsProcessing(false);
    await revalidatePathAction("/");

    if (successCount === updatedRecords.length) {
      setTimeout(() => {
        onOpenChange(false);
        resetState();
        router.push("/memes");
      }, 500);
    }
  };

  const resetState = () => {
    setStep(1);
    setRecords([]);
    setSelectedFiles([]);
    setTotalProgress(0);
    setExcelFileName(null);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isProcessing) {
        onOpenChange(val);
        if (!val) resetState();
      }
    }}>
      <DialogContent className="sm:max-w-[900px] flex flex-col p-0 overflow-hidden [&>button]:hidden border rounded-lg shadow-lg">
        <DialogHeader className="p-5 px-6 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={FileImportIcon} className="size-5 text-primary" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-semibold">Bulk Import</DialogTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-muted-foreground hover:text-primary transition-colors">
                        <HugeiconsIcon icon={InformationCircleIcon} className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[280px] p-3 text-xs bg-card border">
                        <p className="font-semibold mb-1">Quick Guide:</p>
                        <ul className="space-y-1 list-disc pl-3 text-muted-foreground">
                          <li>Upload Excel with exact filenames.</li>
                          <li>Select images for matching.</li>
                          <li>Sync everything to AI storage.</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <DialogDescription className="text-xs">Step {step} of 3</DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={cn(
                      "size-7 rounded-full flex items-center justify-center text-xs font-medium border transition-colors",
                      step === s ? "bg-primary border-primary text-primary-foreground" : 
                      step > s ? "bg-green-600 border-green-600 text-white" : "bg-background text-muted-foreground border-muted"
                    )}
                  >
                    {step > s ? <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" /> : s}
                  </div>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 rounded-md"
                onClick={() => !isProcessing && onOpenChange(false)}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 bg-muted/5">
          {step === 1 && (
            <div className="max-w-lg mx-auto space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold">Upload Excel Data</h3>
                <p className="text-xs text-muted-foreground">Select your filled Excel file to continue.</p>
              </div>
              
              <div className="grid gap-3">
                <div className="relative">
                  <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="border border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-3 bg-card border-muted hover:border-primary transition-colors">
                    <HugeiconsIcon icon={excelFileName ? CheckmarkCircle02Icon : Upload01Icon} className={cn("size-8", excelFileName ? "text-green-600" : "text-primary")} />
                    <div className="text-center">
                      <p className="text-sm font-medium">{excelFileName || "Select Excel File"}</p>
                      <p className="text-[11px] text-muted-foreground">Click to browse or drag and drop</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" className="gap-2 text-xs" onClick={downloadTemplate}>
                    <HugeiconsIcon icon={FileDownloadIcon} className="size-4" />
                    Download Template
                  </Button>
                </div>
              </div>
              
              {records.length > 0 && (
                <div className="flex justify-center pt-2">
                   <Button size="sm" className="px-8 rounded-md font-medium gap-2" onClick={() => setStep(2)}>
                    Continue <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold">Select Media Files</h3>
                <p className="text-xs text-muted-foreground">Upload all images and videos mentioned in your Excel file.</p>
              </div>

              <div className="relative">
                <input type="file" multiple accept="image/*,video/*" onChange={handleImagesUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="border border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-3 bg-card border-muted hover:border-primary transition-colors">
                  <HugeiconsIcon icon={Image01Icon} className="size-8 text-primary" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Select All Meme Files</p>
                    <p className="text-[11px] text-muted-foreground">{selectedFiles.length} files selected</p>
                  </div>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selection ({selectedFiles.length})</p>
                    <p className="text-xs font-semibold text-primary">{records.filter(r => r.matchedFile).length} / {records.length} Matched</p>
                  </div>
                  
                  <div className="grid grid-cols-8 gap-2">
                    {selectedFiles.slice(0, 16).map((f, i) => (
                      <div key={i} className="aspect-square rounded border overflow-hidden">
                        {f.type.startsWith("image") ? (
                          <img src={URL.createObjectURL(f)} alt="f" className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center"><HugeiconsIcon icon={Image01Icon} className="size-4 opacity-20" /></div>
                        )}
                      </div>
                    ))}
                    {selectedFiles.length > 16 && (
                       <div className="aspect-square rounded border bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                        +{selectedFiles.length - 16}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Back</Button>
                    <Button size="sm" className="px-8 rounded-md font-medium gap-2" onClick={() => setStep(3)}>
                      Review List <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-semibold">Final Review</h3>
                <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">{records.filter(r => r.matchedFile).length} / {records.length} Matched</span>
              </div>
              
              <div className="flex-1 min-h-0 border rounded-md overflow-hidden bg-card">
                <div className="h-full overflow-y-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/50 sticky top-0 z-10 border-b">
                      <tr>
                        <th className="p-3 font-semibold text-xs uppercase text-muted-foreground w-16 text-center">Media</th>
                        <th className="p-3 font-semibold text-xs uppercase text-muted-foreground">Meme Information</th>
                        <th className="p-3 font-semibold text-xs uppercase text-muted-foreground w-20 text-right pr-6">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="size-11 rounded border bg-muted/30 flex items-center justify-center overflow-hidden">
                              {r.matchedFile ? (
                                <img src={URL.createObjectURL(r.matchedFile)} alt="p" className="size-full object-cover" />
                              ) : (
                                <HugeiconsIcon icon={Image01Icon} className="size-4 opacity-20" />
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-sm truncate">{r.title || r.filename}</span>
                              <span className="text-xs text-muted-foreground font-mono truncate max-w-[350px] opacity-70">{r.filename}</span>
                              {r.status === "uploading" && <Progress value={r.progress || 0} className="h-1 mt-2" />}
                            </div>
                          </td>
                          <td className="p-3 text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              {r.status === "pending" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => pickFileForRecord(r.id)} 
                                        className={cn("size-8 rounded-md", !r.matchedFile && "text-destructive hover:bg-destructive/10")}
                                      >
                                        <HugeiconsIcon icon={r.matchedFile ? Edit01Icon : PlusSignIcon} className="size-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="text-xs">
                                      {r.matchedFile ? "Change file" : "Manually pick file"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              
                              {r.status === "uploading" && (
                                <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin text-primary" />
                              )}
                              
                              {r.status === "success" && (
                                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-green-600" />
                              )}
                              
                              {r.status === "error" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Button variant="ghost" size="icon" onClick={() => pickFileForRecord(r.id)} className="size-7 text-destructive hover:bg-destructive/10">
                                        <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="text-[10px]">{r.error || "Upload failed"}</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                 <Button variant="ghost" size="sm" onClick={() => setStep(2)} disabled={isProcessing}>Back</Button>
                 <Button size="sm" className="px-10 rounded-md font-medium" onClick={startImport} disabled={isProcessing || records.length === 0}>
                    {isProcessing ? "Syncing..." : "Confirm & Import"}
                 </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-background">
            {isProcessing && (
              <div className="w-full max-w-sm mx-auto space-y-1.5 text-center">
                <Progress value={totalProgress} className="h-1" />
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Progress: {totalProgress}%</p>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
