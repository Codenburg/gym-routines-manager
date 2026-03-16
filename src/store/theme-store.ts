"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Tipo de tema
 */
export type Theme = "light" | "dark";

/**
 * Estado del tema
 */
interface ThemeState {
  theme: Theme;
}

/**
 * Acciones del store de tema
 */
interface ThemeActions {
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Store de tema con persistencia en localStorage
 */
export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set) => ({
      theme: "dark", // Default theme

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),

      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "theme-storage", // localStorage key
    }
  )
);
