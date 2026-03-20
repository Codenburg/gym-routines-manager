"use client";

import { ErrorDisplay } from "@/components/error/error-display";

/**
 * Error boundary global para errores fatales no manejados.
 * 
 * CATCHES: Errores críticos que rompen la app completa (fallos en root layout,
 * errores de hydration severos, errores no capturados en ningún segmento).
 * 
 * NOTA: Este componente reemplaza completamente el contenido del body.
 * Debe tener su propio <html> y <body> para funcionar como overlay.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log interno para debugging - NO exponer al cliente
  console.error("[ErrorBoundary:global]", {
    type: "fatal_error",
    message: error.message,
    digest: error.digest,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <ErrorDisplay
          title="Error inesperado"
          message="Ocurrió un problema crítico. Los técnicos ya fueron notificados."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
