"use client";

import { useEffect, useState } from "react";
import { Controller, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { parseInitialFormat, combineToFormat } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface SeriesRepsInputProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  control?: Control<any>;
  className?: string;
}

/**
 * Split input for series × reps format (e.g., "4x12").
 * 
 * Renders two numeric inputs with a "×" separator.
 * Maintains a hidden field with the combined "4x12" format for form submission.
 * 
 * Usage:
 * - With react-hook-form (ejercicio-row): pass `control` prop
 * - With regular forms (ejercicio-form): pass `name` and `onChange` props
 */
export function SeriesRepsInput({
  name,
  value,
  onChange,
  control,
  className,
}: SeriesRepsInputProps) {
  // Parse initial value into series/reps components
  const parsed = parseInitialFormat(value);
  const [series, setSeries] = useState(parsed.series);
  const [reps, setReps] = useState(parsed.reps);

  // Sync with external value changes (e.g., reset on form)
  useEffect(() => {
    const parsed = parseInitialFormat(value);
    setSeries(parsed.series);
    setReps(parsed.reps);
  }, [value]);

  // Update combined format whenever inputs change
  const updateCombinedValue = (newSeries: string, newReps: string) => {
    const combined = combineToFormat(newSeries, reps);
    onChange?.(combined);
  };

  const handleSeriesChange = (newSeries: string) => {
    setSeries(newSeries);
    updateCombinedValue(newSeries, reps);
  };

  const handleRepsChange = (newReps: string) => {
    setReps(newReps);
    updateCombinedValue(series, newReps);
  };

  // RHF integration mode (ejercicio-row)
  if (control) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className={cn("flex items-center gap-1", className)}>
            <input type="hidden" name={name} value={field.value ?? ""} />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="4"
              value={series}
              onChange={(e) => {
                const newSeries = e.target.value;
                handleSeriesChange(newSeries);
                field.onChange(combineToFormat(newSeries, reps));
              }}
              className="w-12 h-8 text-center seamless-input [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Series"
              min={1}
              max={999}
            />
            <span className="text-muted-foreground text-sm font-medium px-0.5">×</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="12"
              value={reps}
              onChange={(e) => {
                const newReps = e.target.value;
                handleRepsChange(newReps);
                field.onChange(combineToFormat(series, newReps));
              }}
              className="w-12 h-8 text-center seamless-input [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Reps"
              min={1}
              max={999}
            />
          </div>
        )}
      />
    );
  }

  // Direct onChange mode (ejercicio-form)
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Input
        type="number"
        inputMode="numeric"
        placeholder="4"
        value={series}
        onChange={(e) => handleSeriesChange(e.target.value)}
        className="w-12 h-8 text-center seamless-input [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Series"
        min={1}
        max={999}
      />
      <span className="text-muted-foreground text-sm font-medium px-0.5">×</span>
      <Input
        type="number"
        inputMode="numeric"
        placeholder="12"
        value={reps}
        onChange={(e) => handleRepsChange(e.target.value)}
        className="w-12 h-8 text-center seamless-input [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Reps"
        min={1}
        max={999}
      />
      <input type="hidden" name={name} value={combineToFormat(series, reps)} />
    </div>
  );
}