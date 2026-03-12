"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

/**
 * Tipos para Better Auth Session
 */
export interface Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
  expiresAt: string;
}

/**
 * Estado de autenticación
 */
interface AuthState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Acciones del store de autenticación
 */
interface AuthActions {
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
}

/**
 * Store de autenticación en memoria
 * NO usa persist - Better Auth maneja sesiones con cookies httpOnly automáticamente
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  (set) => ({
    session: null,
    isLoading: false,
    error: null,

    setSession: (session) => set({ session, error: null }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    clearSession: () => set({ session: null, error: null }),
  })
);

/**
 * Selector optimizado usando useShallow
 * Evita re-renders innecesarios
 */
export function useAuthSession() {
  return useAuthStore(
    useShallow((state) => ({
      session: state.session,
      isLoading: state.isLoading,
      error: state.error,
    }))
  );
}

/**
 * Selector para verificar si el usuario está autenticado
 */
export function useIsAuthenticated() {
  return useAuthStore(
    useShallow((state) => ({
      isAuthenticated: !!state.session,
      session: state.session,
    }))
  );
}
