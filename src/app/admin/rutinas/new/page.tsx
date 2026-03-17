import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { RutinaCompletaForm } from "@/components/admin/rutina-completa-form";
import { ArrowLeft } from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function NewRutinaPage() {
  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/rutinas"
            className="p-2 hover:bg-[var(--button-secondary-bg)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Nueva Rutina</h1>
            <p className="text-[var(--muted-foreground)] mt-1">Crea una rutina con días y ejercicios</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <RutinaCompletaForm />
        </div>
      </div>
    </AuthGuard>
  );
}
