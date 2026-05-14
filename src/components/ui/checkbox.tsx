"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "group flex size-5 items-center justify-center rounded-sm border transition-all outline-none",
        "border-input bg-background hover:border-primary/50",
        "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator 
        className="flex items-center justify-center text-current transition-transform duration-200 data-unchecked:scale-0 data-checked:scale-100"
      >
        <HugeiconsIcon icon={Tick02Icon} className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
