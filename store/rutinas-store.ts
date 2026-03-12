"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

export interface Ejercicio {
  id: string;
  nombre: string;
  series: string | null;
  repes: string | null;
  orden: number;
}

export interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados: string | null;
  orden: number;
  ejercicios: Ejercicio[];
}

export interface Rutina {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
  dias: Dia[];
}

interface RutinasState {
  rutinas: Rutina[];
  currentRutina: Rutina | null;
  isLoading: boolean;
  error: string | null;
}

interface RutinasActions {
  setRutinas: (rutinas: Rutina[]) => void;
  setCurrentRutina: (rutina: Rutina | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  fetchRutinas: () => Promise<void>;
  fetchRutina: (id: string) => Promise<void>;
  addRutina: (rutina: Rutina) => void;
  updateRutina: (id: string, updates: Partial<Rutina>) => void;
  removeRutina: (id: string) => void;
}

export const useRutinasStore = create<RutinasState & RutinasActions>()(
  persist(
    (set, get) => ({
      rutinas: [],
      currentRutina: null,
      isLoading: false,
      error: null,

      setRutinas: (rutinas) => set({ rutinas, error: null }),

      setCurrentRutina: (rutina) => set({ currentRutina: rutina, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      fetchRutinas: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/rutinas");
          if (!response.ok) {
            throw new Error("Error al obtener las rutinas");
          }
          const rutinas = await response.json();
          set({ rutinas, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Error desconocido",
            isLoading: false,
          });
        }
      },

      fetchRutina: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/rutinas/${id}`);
          if (!response.ok) {
            throw new Error("Error al obtener la rutina");
          }
          const rutina = await response.json();
          set({ currentRutina: rutina, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Error desconocido",
            isLoading: false,
          });
        }
      },

      addRutina: (rutina) =>
        set((state) => ({
          rutinas: [...state.rutinas, rutina],
        })),

      updateRutina: (id, updates) =>
        set((state) => ({
          rutinas: state.rutinas.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
          currentRutina:
            state.currentRutina?.id === id
              ? { ...state.currentRutina, ...updates }
              : state.currentRutina,
        })),

      removeRutina: (id) =>
        set((state) => ({
          rutinas: state.rutinas.filter((r) => r.id !== id),
          currentRutina:
            state.currentRutina?.id === id ? null : state.currentRutina,
        })),
    }),
    {
      name: "rutinas-storage",
      partialize: (state) => ({ rutinas: state.rutinas }),
    }
  )
);

export function useRutinas() {
  return useRutinasStore(
    useShallow((state) => ({
      rutinas: state.rutinas,
      isLoading: state.isLoading,
      error: state.error,
    }))
  );
}

export function useCurrentRutina() {
  return useRutinasStore(
    useShallow((state) => ({
      currentRutina: state.currentRutina,
      isLoading: state.isLoading,
      error: state.error,
    }))
  );
}

export function useRutinasLoading() {
  return useRutinasStore(
    useShallow((state) => ({
      isLoading: state.isLoading,
      error: state.error,
    }))
  );
}
