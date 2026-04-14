"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  showLabel = false,
  labelOn = "Visible",
  labelOff = "Oculta",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default" | "lg"
  showLabel?: boolean
  labelOn?: string
  labelOff?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <SwitchPrimitive.Root
        data-slot="switch"
        data-size={size}
        className={cn(
          "peer group relative inline-flex shrink-0 cursor-pointer rounded-full shadow-xs transition-colors duration-200 ease-out outline-none",
          "hover:brightness-110",
          "active:scale-[0.98]",
          "focus-visible:ring-[3px] focus-visible:ring-primary focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Size variants
          "data-[size=lg]:h-7 data-[size=lg]:w-[3.25rem] data-[size=lg]:p-0.5",
          "data-[size=default]:h-6 data-[size=default]:w-11 data-[size=default]:p-0.5",
          "data-[size=sm]:h-4 data-[size=sm]:w-7 data-[size=sm]:p-0.5",
          // Track colors - work on Root because Root has the data attributes
          "data-[checked]:bg-emerald-500 data-[unchecked]:bg-zinc-500",
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className={cn(
            "pointer-events-none block rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out",
            // Size based thumb dimensions
            "data-[size=lg]:size-5 data-[size=default]:size-[18px] data-[size=sm]:size-3",
            // Thumb positions using group-data-[checked] - positions thumb within track
            "data-[size=lg]:group-data-[checked]:translate-x-[1.375rem] data-[size=lg]:group-data-[unchecked]:translate-x-0",
            "data-[size=default]:group-data-[checked]:translate-x-[1.25rem] data-[size=default]:group-data-[unchecked]:translate-x-0",
            "data-[size=sm]:group-data-[checked]:translate-x-[0.875rem] data-[size=sm]:group-data-[unchecked]:translate-x-0"
          )}
        />
      </SwitchPrimitive.Root>
      {showLabel && (
        <span
          className={cn(
            "text-xs font-medium select-none transition-colors duration-200",
            props.checked ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/70",
            size === "sm" && "text-[10px]"
          )}
        >
          {props.checked ? labelOn : labelOff}
        </span>
      )}
    </div>
  )
}

export { Switch }
