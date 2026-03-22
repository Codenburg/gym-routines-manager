"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ChipOption {
  value: string;
  label: string;
}

interface ChipSelectorProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
}

export function ChipSelector({
  options,
  value,
  onChange,
  disabled = false,
  name,
}: ChipSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % options.length);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onChange(options[index].value);
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(options.length - 1);
          break;
      }
    },
    [disabled, options, onChange]
  );

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={name || "Seleccionar opción"}
      className="flex flex-wrap gap-2"
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isFocused = index === focusedIndex;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            disabled={disabled}
            tabIndex={isFocused || (focusedIndex === -1 && index === 0) ? 0 : -1}
            onClick={() => !disabled && onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(-1)}
            data-selected={isSelected ? "true" : undefined}
            className={cn(
              // Base styles
              "px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-100 ease-out",
              // Unselected state - light mode
              "border border-[#e5e7eb] bg-white text-[#6b7280]",
              "hover:border-[#48b8c9] hover:text-[#48b8c9]",
              // Dark mode unselected
              "dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-[#9ca3af]",
              "dark:hover:border-[#48b8c9] dark:hover:text-[#48b8c9]",
              // Selected state
              "data-[selected]:bg-[#48b8c9] data-[selected]:border-[#48b8c9]",
              "data-[selected]:text-white",
              // Focus state
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48b8c9] focus-visible:ring-offset-2",
              // Disabled state
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
