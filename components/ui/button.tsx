import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[var(--background)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Variants
          variant === "primary" && "bg-[var(--button-primary-bg)] hover:opacity-90 text-[var(--button-primary-foreground)]",
          variant === "secondary" && "bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] border border-[var(--button-secondary-border)]",
          variant === "danger" && "bg-red-900/50 hover:bg-red-900 text-red-400 border border-red-700",
          variant === "ghost" && "hover:bg-[var(--button-secondary-bg)] text-[var(--muted)] hover:text-[var(--foreground)]",
          // Sizes
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2 text-sm",
          size === "lg" && "px-6 py-3 text-base",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";