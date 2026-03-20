"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
  className?: string;
}

export function ErrorDisplay({
  title = "Algo salió mal",
  message = "No pudimos completar la operación. Por favor, intenta de nuevo.",
  onRetry,
  showHome = true,
  className = "",
}: ErrorDisplayProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[400px] px-4 py-12 text-center ${className}`}
    >
      <div className="flex flex-col items-center max-w-md">
        {/* Icon */}
        <div className="mb-6 p-4 rounded-full bg-destructive/10">
          <AlertTriangle className="w-12 h-12 text-destructive" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-foreground mb-3">{title}</h2>

        {/* Message */}
        <p className="text-muted-foreground mb-8">{message}</p>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={handleRetry} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>

          {showHome && (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 min-w-[130px] border border-border bg-background hover:bg-muted hover:text-foreground text-muted-foreground rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
            >
              <Home className="w-4 h-4" />
              Volver al inicio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
