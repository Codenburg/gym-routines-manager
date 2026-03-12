import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-lg border bg-black px-3 py-2 text-sm text-white placeholder:text-white/50",
        "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-200",
        "resize-none",
        error ? "border-red-500 focus:ring-red-500" : "border-white/30 hover:border-white/50",
        className
      )}
      {...props}
    />
  );
}