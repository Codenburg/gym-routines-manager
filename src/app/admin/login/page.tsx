"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface LoginFormData {
  dni: string;
  password: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Usar signIn.username para autenticar con DNI
      await authClient.signIn.username(
        {
          username: data.dni,
          password: data.password,
        },
        {
          onSuccess: () => {
            router.push("/admin");
            router.refresh();
          },
          onError: (ctx) => {
            let mensaje = ctx.error.message;
            if (mensaje.includes("Invalid") || mensaje.includes("email")) {
              mensaje = "DNI o contraseña incorrectos";
            }
            toast.error(mensaje);
            setIsLoading(false);
          },
        }
      );
    } catch (err) {
      toast.error("Error de conexión. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)] overflow-hidden">
      <div className="w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Champion Gym</h1>
          <p className="text-[var(--muted-foreground)]">Panel de Administración</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="dni" className="text-[var(--foreground)] text-sm font-medium">
              DNI
            </label>
            <input
              id="dni"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={isLoading}
              autoComplete="off"
              {...register("dni", {
                required: "El DNI es requerido",
                pattern: {
                  value: /^\d{7,8}$/,
                  message: "El DNI debe tener 7 u 8 dígitos",
                },
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 8);
                },
              })}
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-foreground)] placeholder:[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors disabled:opacity-50"
              placeholder="12345678"
            />
            {errors.dni && (
              <p className="text-red-400 text-sm">{errors.dni.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-[var(--foreground)] text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              disabled={isLoading}
              autoComplete="off"
              {...register("password", {
                required: "La contraseña es requerida",
              })}
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-foreground)] placeholder:[var(--input-placeholder)] focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-colors disabled:opacity-50"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-400 text-sm">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[var(--button-primary-bg)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--button-primary-foreground)] font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Back to home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-sm transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
