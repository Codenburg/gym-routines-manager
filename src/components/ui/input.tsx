import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { error?: boolean }>(
  ({ className, type, error, value, onChange, ...rest }, ref) => {
    // Only set value/onChange when value is explicitly provided (controlled)
    // When value is undefined, let defaultValue flow through rest (uncontrolled)
    // This allows RHF's register() to work without controlled/uncontrolled mismatch
    const isControlled = value !== undefined

    return (
      <InputPrimitive
        {...rest}
        ref={ref}
        type={type}
        value={isControlled ? value : undefined}
        onChange={isControlled ? onChange : undefined}
        data-slot="input"
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-background dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
          className
        )}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
