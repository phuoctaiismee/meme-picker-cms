import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative flex h-5.5 w-11 rounded-full bg-linear-to-r from-gray-700 from-35% to-gray-200 to-65% bg-size-[5.5rem_100%] bg-position-[100%_0%] bg-no-repeat p-px shadow-[inset_0_1.5px_2px] shadow-gray-200 outline-1 -outline-offset-1 outline-gray-200 transition-[background-position,box-shadow] duration-125 ease-[cubic-bezier(0.26,0.75,0.38,0.45)] before:absolute before:rounded-full before:outline-offset-2 before:outline-blue-800 focus-visible:before:inset-0 focus-visible:before:outline-2 active:bg-gray-100 data-checked:bg-position-[0%_0%] data-checked:active:bg-gray-500 dark:from-gray-500 dark:shadow-black/75 dark:outline-white/15 dark:data-checked:shadow-none",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="aspect-square h-full rounded-full bg-white shadow-[0_0_1px_1px,0_1px_1px,1px_2px_4px_-1px] shadow-gray-100 transition-transform duration-150 data-checked:translate-x-6 dark:shadow-black/25" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
