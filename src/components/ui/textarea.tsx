import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea"> & { error?: boolean }>(
  ({ className, error, value, onChange, ...rest }, ref) => {
    // Only set value/onChange when value is explicitly provided (controlled)
    // When value is undefined, let defaultValue flow through rest (uncontrolled)
    const isControlled = value !== undefined;

    return (
      <textarea
        {...rest}
        ref={ref}
        value={isControlled ? value : undefined}
        onChange={isControlled ? onChange : undefined}
        data-slot="textarea"
        aria-invalid={error ? true : undefined}
        className={cn(
          "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-background px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-background dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
          className
        )}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
