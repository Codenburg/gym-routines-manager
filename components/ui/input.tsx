import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ className, type = "text", error, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border bg-slate-800/50 px-3 py-2 text-sm text-white placeholder:text-slate-500",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-200",
        error ? "border-red-500 focus:ring-red-500" : "border-slate-700 hover:border-slate-600",
        className
      )}
      {...props}
    />
  );
}
