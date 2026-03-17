import Link from "next/link";
import { getFeriados } from "@/app/actions/feriados";
import { AuthGuard } from "@/components/auth-guard";
import { FeriadoManager } from "@/components/admin/feriado-manager";
import { ArrowLeft } from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function AdminFeriadosPage() {
  const feriados = await getFeriados();

  // Transform dates for client component
  const serializableFeriados = feriados.map((f) => ({
    id: f.id,
    fecha: new Date(f.fecha),
  }));

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-[var(--button-secondary-bg)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Feriados</h1>
            <p className="text-[var(--muted-foreground)] mt-1">Administra los días feriados</p>
          </div>
        </div>

        {/* Feriado Manager */}
        <FeriadoManager initialFeriados={serializableFeriados} />
      </div>
    </AuthGuard>
  );
}
