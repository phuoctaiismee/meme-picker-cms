"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
  disable?: boolean;
  fixed?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface MultipleSelectorProps {
  value?: Option[];
  defaultOptions?: Option[];
  options?: Option[];
  placeholder?: string;
  loadingIndicator?: React.ReactNode;
  emptyIndicator?: React.ReactNode;
  delay?: number;
  triggerSearchOnFocus?: boolean;
  onSearch?: (value: string) => Promise<Option[]>;
  onSearchSync?: (value: string) => Option[];
  onChange?: (options: Option[]) => void;
  maxSelected?: number;
  onMaxSelected?: (maxLimit: number) => void;
  hidePlaceholderWhenSelected?: boolean;
  disabled?: boolean;
  className?: string;
  badgeClassName?: string;
  creatable?: boolean;
  inputProps?: Omit<
    React.ComponentPropsWithoutRef<typeof InputPrimitive>,
    "value" | "placeholder" | "disabled"
  >;
  hideClearAllButton?: boolean;
}

export interface MultipleSelectorRef {
  selectedValue: Option[];
  input: HTMLInputElement | null;
  focus: () => void;
  reset: () => void;
}

export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);

    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

function uniqueOptions(options: Option[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    if (seen.has(option.value)) {
      return false;
    }

    seen.add(option.value);
    return true;
  });
}

const MultipleSelector = React.forwardRef<
  MultipleSelectorRef,
  MultipleSelectorProps
>(function MultipleSelector(
  {
    value,
    onChange,
    placeholder,
    defaultOptions = [],
    options: controlledOptions,
    delay = 300,
    onSearch,
    onSearchSync,
    loadingIndicator,
    emptyIndicator,
    maxSelected = Number.MAX_SAFE_INTEGER,
    onMaxSelected,
    hidePlaceholderWhenSelected,
    disabled,
    className,
    badgeClassName,
    creatable = false,
    triggerSearchOnFocus = false,
    inputProps,
    hideClearAllButton = false,
  },
  ref
) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Option[]>(value ?? []);
  const [inputValue, setInputValue] = React.useState("");
  const [asyncOptions, setAsyncOptions] = React.useState<Option[]>(defaultOptions);
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedSearchTerm = useDebounce(inputValue, delay);

  const sourceOptions = controlledOptions ?? asyncOptions;
  const selectableOptions = React.useMemo(() => {
    const picked = new Set(selected.map((option) => option.value));

    return uniqueOptions(sourceOptions).filter((option) => !picked.has(option.value));
  }, [selected, sourceOptions]);

  const createOption = React.useMemo(() => {
    const label = inputValue.trim();

    if (!creatable || !label) {
      return null;
    }

    if ([...selected, ...sourceOptions].some((option) => option.value === label)) {
      return null;
    }

    return { value: label, label };
  }, [creatable, inputValue, selected, sourceOptions]);

  const commitSelected = React.useCallback(
    (nextSelected: Option[]) => {
      setSelected(nextSelected);
      onChange?.(nextSelected);
    },
    [onChange]
  );

  const addOption = React.useCallback(
    (option: Option) => {
      if (option.disable) {
        return;
      }

      if (selected.length >= maxSelected) {
        onMaxSelected?.(maxSelected);
        return;
      }

      setInputValue("");
      commitSelected([...selected, option]);
    },
    [commitSelected, maxSelected, onMaxSelected, selected]
  );

  const removeOption = React.useCallback(
    (option: Option) => {
      if (option.fixed) {
        return;
      }

      commitSelected(selected.filter((item) => item.value !== option.value));
    },
    [commitSelected, selected]
  );

  React.useImperativeHandle(
    ref,
    () => ({
      selectedValue: selected,
      input: inputRef.current,
      focus: () => inputRef.current?.focus(),
      reset: () => commitSelected([]),
    }),
    [commitSelected, selected]
  );

  React.useEffect(() => {
    if (value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(value);
    }
  }, [value]);

  React.useEffect(() => {
    if (!controlledOptions && !onSearch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAsyncOptions(defaultOptions);
    }
  }, [controlledOptions, defaultOptions, onSearch]);

  React.useEffect(() => {
    if (!open || !onSearchSync) {
      return;
    }

    if (!triggerSearchOnFocus && !debouncedSearchTerm) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAsyncOptions(onSearchSync(debouncedSearchTerm));
  }, [debouncedSearchTerm, onSearchSync, open, triggerSearchOnFocus]);

  React.useEffect(() => {
    if (!open || !onSearch) {
      return;
    }

    if (!triggerSearchOnFocus && !debouncedSearchTerm) {
      return;
    }

    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    onSearch(debouncedSearchTerm)
      .then((results) => {
        if (!cancelled) {
          setAsyncOptions(results);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchTerm, onSearch, open, triggerSearchOnFocus]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          "border-input focus-within:border-ring focus-within:ring-ring/50 relative min-h-9 rounded-md border text-sm transition-[color,box-shadow] focus-within:ring-[3px]",
          disabled && "pointer-events-none opacity-50",
          selected.length > 0 && "p-1",
          !hideClearAllButton && "pr-9",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-1">
          {selected.map((option) => (
            <span
              key={option.value}
              className={cn(
                "relative inline-flex h-7 items-center rounded-md border bg-background pr-7 pl-2 text-xs font-medium",
                option.fixed && "pr-2",
                badgeClassName
              )}
            >
              {option.label}
              {!option.fixed && (
                <ButtonPrimitive
                  type="button"
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex size-7 items-center justify-center rounded-r-md"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeOption(option);
                  }}
                  aria-label={`Remove ${option.label}`}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                </ButtonPrimitive>
              )}
            </span>
          ))}
          <InputPrimitive
            {...inputProps}
            ref={inputRef}
            value={inputValue}
            disabled={disabled}
            placeholder={
              hidePlaceholderWhenSelected && selected.length > 0 ? "" : placeholder
            }
            className={cn(
              "placeholder:text-muted-foreground flex-1 bg-transparent outline-none",
              selected.length === 0 ? "px-3 py-2" : "ml-1 h-7 min-w-28",
              inputProps?.className
            )}
            onFocus={(event) => {
              setOpen(true);
              inputProps?.onFocus?.(event);
            }}
            onChange={(event) => {
              setInputValue(event.target.value);
              inputProps?.onChange?.(event);
            }}
            onKeyDown={(event) => {
              if (
                (event.key === "Backspace" || event.key === "Delete") &&
                !inputValue &&
                selected.length > 0
              ) {
                removeOption(selected[selected.length - 1]);
              }

              if ((event.key === "Enter" || event.key === ",") && createOption) {
                event.preventDefault();
                addOption(createOption);
              }

              if (event.key === "Escape") {
                setOpen(false);
                inputRef.current?.blur();
              }

              inputProps?.onKeyDown?.(event);
            }}
          />
          {!hideClearAllButton &&
            selected.some((option) => !option.fixed) &&
            !disabled && (
              <ButtonPrimitive
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex size-9 items-center justify-center rounded-md"
                onClick={(event) => {
                  event.stopPropagation();
                  commitSelected(selected.filter((option) => option.fixed));
                }}
                aria-label="Clear all"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </ButtonPrimitive>
            )}
        </div>
      </div>

      {open && (
        <div className="border-input bg-popover text-popover-foreground absolute top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border p-1 shadow-lg">
          {isLoading ? (
            loadingIndicator ?? (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                Loading...
              </div>
            )
          ) : (
            <>
              {createOption && (
                <ButtonPrimitive
                  type="button"
                  className="block w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => addOption(createOption)}
                >
                  Create &quot;{createOption.label}&quot;
                </ButtonPrimitive>
              )}
              {selectableOptions.length === 0 && !createOption
                ? emptyIndicator ?? (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      No results found.
                    </div>
                  )
                : selectableOptions.map((option) => (
                    <ButtonPrimitive
                      key={option.value}
                      type="button"
                      disabled={option.disable}
                      className={cn(
                        "block w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
                        option.disable && "hover:bg-transparent"
                      )}
                      onClick={() => addOption(option)}
                    >
                      {option.label}
                      {typeof option.category === "string" && option.category && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {option.category}
                        </span>
                      )}
                    </ButtonPrimitive>
                  ))}
            </>
          )}
        </div>
      )}
    </div>
  );
});

MultipleSelector.displayName = "MultipleSelector";

export default MultipleSelector;
