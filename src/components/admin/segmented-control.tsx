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
          // Background container - semantic token, inline-flex to fit content
          "inline-flex bg-muted rounded-lg p-1",
          // Horizontal layout, no stretch
          "flex-nowrap items-center gap-1",
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
              className={cn(
                // Base styles - inline-flex, no grow
                "inline-flex items-center gap-2 h-9 px-3 rounded-md text-sm font-medium transition-all duration-150 ease-out",
                "flex-none whitespace-nowrap",
                // Focus state - ring using semantic token
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                // Disabled state
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
                // Unselected state - semantic tokens
                "text-muted-foreground bg-transparent hover:text-foreground hover:bg-accent",
                // Selected state - primary token
                isSelected && "bg-primary text-primary-foreground shadow-sm"
              )}
            >
              {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
              <span>{option.label}</span>
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
