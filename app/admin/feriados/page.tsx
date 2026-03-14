import Link from "next/link";
import { getFeriados } from "@/app/actions/feriados";
import { AuthGuard } from "@/components/auth-guard";
import { FeriadoManager } from "@/components/admin/feriado-manager";

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
            className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Feriados</h1>
            <p className="text-white/60 mt-1">Administra los días feriados</p>
          </div>
        </div>

        {/* Feriado Manager */}
        <FeriadoManager initialFeriados={serializableFeriados} />
      </div>
    </AuthGuard>
  );
}
