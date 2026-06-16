"use client";

import { useState, useEffect } from "react";

/**
 * Wrapper that renders children only on the client side.
 * Used to wrap DndContext and other SSR-incompatible components.
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
