import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface SelectOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<SelectPrimitive.Root.Props<string>, "items" | "children"> {
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

function Select({
  options,
  placeholder = "Select option",
  className,
  ...props
}: SelectProps) {
  return (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        className={cn(
          "border-input bg-background flex h-9 w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          className
        )}
      >
        <SelectPrimitive.Value>
          {(value: string | null) => {
            const selected = options.find((option) => option.value === value);

            return selected?.label ?? placeholder;
          }}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon className="text-muted-foreground">
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={4}>
          <SelectPrimitive.Popup className="bg-popover text-popover-foreground z-50 max-h-(--available-height) min-w-(--anchor-width) overflow-auto rounded-md border p-1 shadow-md outline-none">
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex cursor-default items-center rounded-sm px-2 py-1.5 pr-8 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  {option.label}
                  <SelectPrimitive.ItemIndicator className="absolute right-2">
                    <HugeiconsIcon icon={Tick02Icon} className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { Select };
