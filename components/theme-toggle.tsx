"use client";

import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";

/**
 * ThemeToggle - Botón para cambiar entre tema claro y oscuro
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-[var(--button-secondary-bg)] transition-colors"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
