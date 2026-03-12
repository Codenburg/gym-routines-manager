"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      // Dynamic import to avoid initialization issues
      const { signIn } = await import("@/lib/auth-client");
      
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setFormState({
          error: result.error.message || "Error al iniciar sesión",
          isLoading: false,
        });
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setFormState({
        error: "Error de conexión. Intenta de nuevo.",
        isLoading: false,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Champion Gym</h1>
          <p className="text-gray-400">Panel de Administración</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {formState.error && (
            <div className="p-3 bg-red-900/50 border border-red-600 rounded-md">
              <p className="text-red-400 text-sm">{formState.error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-white text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
              placeholder="admin@championgym.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-white text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={formState.isLoading}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors"
          >
            {formState.isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Back to home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
