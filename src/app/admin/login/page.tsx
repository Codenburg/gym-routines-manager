"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

interface FormState {
  error: string | null;
  isLoading: boolean;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({
    error: null,
    isLoading: false,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState({ error: null, isLoading: true });

    try {
      const result = await authClient.signIn.email(
        {
          email,
          password,
        },
        {
          onRequest: () => {
            setFormState({ error: null, isLoading: true });
          },
          onSuccess: () => {
            router.push("/admin");
            router.refresh();
          },
          onError: (ctx) => {
            setFormState({
              error: ctx.error.message || "Error al iniciar sesión",
              isLoading: false,
            });
          },
        }
      );
    } catch (err) {
      setFormState({
        error: "Error de conexión. Intenta de nuevo.",
        isLoading: false,
      });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)] overflow-hidden">
      <div className="w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Champion Gym</h1>
          <p className="text-[var(--muted)]">Panel de Administración</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {formState.error && (
            <div className="p-3 bg-red-900/50 border border-red-600 rounded-md">
              <p className="text-red-400 text-sm">{formState.error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-[var(--foreground)] text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-foreground)] placeholder:[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
              placeholder="admin@championgym.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-[var(--foreground)] text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-foreground)] placeholder:[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={formState.isLoading}
            className="w-full py-3 px-4 bg-[var(--button-primary-bg)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--button-primary-foreground)] font-semibold rounded-md transition-colors"
          >
            {formState.isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Back to home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
