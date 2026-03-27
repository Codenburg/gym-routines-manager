// Login Page Template
// app/(auth)/admin/login/page.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface LoginFormData {
  username: string;
  password: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await authClient.signIn.username(
        { username: data.username, password: data.password },
        {
          onSuccess: () => {
            router.push("/admin");
            router.refresh();
          },
          onError: (ctx) => {
            toast.error(ctx.error.message || "Credenciales inválidas");
            setIsLoading(false);
          },
        }
      );
    } catch {
      toast.error("Error de conexión");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Username / DNI</label>
            <input
              {...register("username", { required: true })}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              {...register("password", { required: true })}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            {isLoading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </form>
    </div>
  );
}
