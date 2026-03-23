"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dumbbell,
  Heart,
  StretchHorizontal,
  BicepsFlexed,
} from "lucide-react";

interface SegmentedControlOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  name: string;
  options: SegmentedControlOption[];
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

// Map of routine types to Lucide icons
const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  fuerza: Dumbbell,
  cardio: Heart,
  flexibilidad: StretchHorizontal,
  hipertrofia: BicepsFlexed,
};

export function SegmentedControl({
  name,
  options,
  value,
  onChange,
  disabled = false,
  error,
}: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          const nextIndex = (index + 1) % options.length;
          setFocusedIndex(nextIndex);
          // Focus the next button
          const buttons = containerRef.current?.querySelectorAll("button");
          buttons?.[nextIndex]?.focus();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          const prevIndex = (index - 1 + options.length) % options.length;
          setFocusedIndex(prevIndex);
          // Focus the previous button
          const prevButtons = containerRef.current?.querySelectorAll("button");
          prevButtons?.[prevIndex]?.focus();
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onChange?.(options[index].value);
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          const homeButtons = containerRef.current?.querySelectorAll("button");
          homeButtons?.[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          const endIndex = options.length - 1;
          setFocusedIndex(endIndex);
          const endButtons = containerRef.current?.querySelectorAll("button");
          endButtons?.[endIndex]?.focus();
          break;
      }
    },
    [disabled, options, onChange]
  );

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        role="tablist"
        aria-label={name || "Seleccionar opción"}
        className={cn(
          "inline-flex bg-muted dark:bg-[#1a1a1a] rounded-lg p-1 gap-1",
          // Mobile: flex-wrap with gap-2 to prevent overflow
          "flex-wrap gap-2",
          // Tablet+: single row
          "md:flex-nowrap md:overflow-x-auto md:gap-1",
          // Error state
          error && "ring-2 ring-destructive/50"
        )}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          const isFocused = index === focusedIndex;
          const Icon = typeIcons[option.value];

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-checked={isSelected}
              aria-label={option.label}
              disabled={disabled}
              tabIndex={isFocused || (focusedIndex === -1 && index === 0) ? 0 : -1}
              onClick={() => !disabled && onChange?.(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
              data-selected={isSelected ? "true" : undefined}
              className={cn(
                // Base styles
                "px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ease-out",
                "flex items-center gap-1.5 min-w-fit",
                // Focus state - turquoise ring in light, red in dark
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48b8c9] focus-visible:ring-offset-2 focus-visible:ring-offset-muted",
                "dark:focus-visible:ring-[#E11D48] dark:focus-visible:ring-offset-[#1a1a1a]",
                // Disabled state
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
                // Unselected state - light mode
                "text-[#6b7280] bg-transparent hover:text-[#111827]",
                // Unselected state - dark mode
                "dark:text-[#9ca3af] dark:hover:text-[#f8fafc]",
                // Selected state - turquoise in light, red in dark
                "data-[selected=true]:bg-[#48b8c9] data-[selected=true]:text-white data-[selected=true]:shadow-sm",
                "dark:data-[selected=true]:bg-[#E11D48] dark:data-[selected=true]:text-white",
                // Hover on unselected - light mode
                "hover:bg-[#e5e7eb] dark:hover:bg-[#27272a]"
              )}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span className="whitespace-nowrap">{option.label}</span>
            </button>
          );
        })}
      </div>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />
      {/* Error message */}
      {error && (
        <p className="text-destructive text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
