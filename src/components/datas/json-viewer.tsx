"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { CodeIcon, Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface JsonViewerProps {
  data: any
  title?: string
  label?: string
}

export function JsonViewer({ data, title = "JSON Preview", label = "JSON" }: JsonViewerProps) {
  const [copied, setCopied] = React.useState(false)
  const jsonString = React.useMemo(() => JSON.stringify(data, null, 2), [data])
  const previewString = React.useMemo(() => {
    const str = JSON.stringify(data, null, 2)
    return str.length > 200 ? str.slice(0, 200) + "..." : str
  }, [data])

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return <span className="text-muted-foreground text-xs italic">Empty</span>
  }

  return (
    <Dialog>
      <Tooltip delay={300}>
        <TooltipTrigger
          render={(triggerProps) => (
            <DialogTrigger
              render={(dialogProps) => (
                <button
                  {...triggerProps}
                  {...dialogProps}
                  className="group inline-flex items-center gap-1.5 cursor-pointer outline-none active:scale-95 transition-transform"
                >
                  <Badge
                    variant="outline"
                    className="px-2 py-0.5 rounded text-[10px] bg-muted font-bold text-muted-foreground uppercase tracking-wider group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all border-transparent"
                  >
                    {label}
                  </Badge>
                </button>
              )}
            />
          )}
        />
        <TooltipContent side="top" className="p-0 border-muted-foreground/20 bg-zinc-950 text-zinc-300 shadow-xl overflow-hidden max-w-sm">
          <div className="px-3 py-1.5 bg-muted/10 border-b border-white/10 flex items-center justify-between gap-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Preview</span>
            <span className="text-[9px] text-muted-foreground/50 font-mono">JSON</span>
          </div>
          <pre className="p-3 font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap opacity-90 italic">
            {previewString}
          </pre>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col gap-0 p-0 overflow-hidden border-border/50 shadow-2xl backdrop-blur-3xl bg-background/95">
        <DialogHeader className="p-4 pr-12 border-b bg-muted/5 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <HugeiconsIcon icon={CodeIcon} className="size-4" />
            </div>
            {title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1.5 px-3 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className={cn("size-3.5", copied && "text-emerald-400")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 bg-zinc-950 dark:bg-black/40 font-mono text-xs leading-relaxed custom-scrollbar">
          <pre className="text-emerald-400/90 whitespace-pre-wrap break-all">
            {jsonString.split('\n').map((line, i) => {
              // Simple syntax highlighting simulation
              const isKey = line.includes('":')
              if (isKey) {
                const [key, ...rest] = line.split('":')
                return (
                  <div key={i} className="flex">
                    <span className="text-blue-400">{key}"</span>
                    <span className="text-zinc-400">:</span>
                    <span className="text-amber-300">{rest.join('":')}</span>
                  </div>
                )
              }
              return <div key={i} className="text-zinc-400">{line}</div>
            })}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
