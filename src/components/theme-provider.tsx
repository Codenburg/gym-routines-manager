"use client";

import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/store/theme-store";

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider - Sincroniza el tema con la clase del elemento HTML
 * Debe envolver la app para que los cambios de tema se reflejen globalmente
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // Sincronizar la clase del html con el tema actual
    const root = document.documentElement;
    
    // Remover ambas clases primero
    root.classList.remove("light", "dark");
    
    // Agregar la clase del tema actual
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}
