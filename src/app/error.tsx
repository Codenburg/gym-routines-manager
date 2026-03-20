"use client";

import { ErrorDisplay } from "@/components/error/error-display";

/**
 * Error boundary para el segmento de la homepage.
 * 
 * CATCHES: Errores verdaderamente inesperados que no fueron manejados
 * anteriormente en la capa de datos (bugs, fallos de render, estados no controlados).
 * 
 * NO CAPTURA: Errores de infraestructura como DB caída - estos se resuelven
 * en getRutinas() con graceful degradation que devuelve [].
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log interno para debugging - NO exponer al cliente
  console.error("[ErrorBoundary:homepage]", {
    type: "unexpected_error",
    message: error.message,
    digest: error.digest,
    timestamp: new Date().toISOString(),
  });

  return (
    <ErrorDisplay
      title="Algo salió mal"
      message="No pudimos completar la operación. Por favor, intenta de nuevo."
      onRetry={reset}
    />
  );
}
