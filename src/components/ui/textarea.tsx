import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-lg border bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--input-foreground)] placeholder:text-[var(--input-placeholder)]",
        "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-200",
        "resize-none",
        error ? "border-red-500 focus:ring-red-500" : "border-[var(--input-border)] hover:border-[var(--button-secondary-border)]",
        className
      )}
      {...props}
    />
  );
}