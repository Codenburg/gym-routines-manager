import Link from "next/link";
import { getRutinas } from "@/app/actions/rutinas";
import prisma from "@/lib/prisma";
import { GymPriceEditor } from "@/components/admin/GymPriceEditor";
import { DataResult, ok, err } from "@/lib/data-result";
import { FileText, Calendar, TrendingUp, Plus, AlertCircle } from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface Stats {
  rutinasCount: number;
  diasCount: number;
  ejerciciosCount: number;
}

async function getStats(): Promise<DataResult<Stats>> {
  try {
    const [rutinasCount, diasCount, ejerciciosCount] = await Promise.all([
      prisma.rutina.count(),
      prisma.dia.count(),
      prisma.ejercicio.count(),
    ]);

    return ok({
      rutinasCount,
      diasCount,
      ejerciciosCount,
    });
  } catch (error) {
    console.error("[getStats] Failed to fetch stats:", error);
    return err({ rutinasCount: 0, diasCount: 0, ejerciciosCount: 0 });
  }
}

async function getGymPrice(): Promise<DataResult<number | null>> {
  try {
    const gym = await prisma.gym.findUnique({
      where: { id: "gym" },
    });
    // Gym auto-created by API if not exists
    return ok(gym ? Number(gym.price) : null);
  } catch (error) {
    console.error("[getGymPrice] Failed to fetch gym price:", error);
    return err(null);
  }
}

export default async function AdminDashboardPage() {
  const [statsResult, rutinasResult, gymPriceResult] = await Promise.all([
    getStats(),
    getRutinas(),
    getGymPrice(),
  ]);

  const stats = statsResult.data;
  const rutinas = rutinasResult;
  const gymPrice = gymPriceResult.data;
  const hasError = statsResult.error || gymPriceResult.error;

  return (
    <div className="space-y-8">
      {/* Gym Price Editor */}
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Panel de administrador</h2>
        <GymPriceEditor initialPrice={gymPrice} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-[var(--muted-foreground)] text-sm">Total Rutinas</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {stats.rutinasCount}
                {statsResult.error && <AlertCircle className="inline-block w-4 h-4 text-destructive ml-2" />}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[var(--muted-foreground)] text-sm">Total Días</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {stats.diasCount}
                {statsResult.error && <AlertCircle className="inline-block w-4 h-4 text-destructive ml-2" />}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-[var(--muted-foreground)] text-sm">Total Ejercicios</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {stats.ejerciciosCount}
                {statsResult.error && <AlertCircle className="inline-block w-4 h-4 text-destructive ml-2" />}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Acciones Rápidas</h2>
        <div className="flex gap-4 flex-wrap">
          <Link
            href="/admin/rutinas/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--button-primary-bg)] hover:opacity-90 text-[var(--button-primary-foreground)] rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Rutina
          </Link>
          <Link
            href="/admin/rutinas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-colors"
          >
            <FileText className="w-5 h-5" />
            Ver Rutinas
          </Link>
          <Link
            href="/admin/feriados"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--button-secondary-bg)] hover:opacity-80 text-[var(--button-secondary-foreground)] rounded-lg transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Ver Feriados
          </Link>
        </div>
      </div>

      {/* Recent Routines */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Rutinas Recientes</h2>
        {hasError && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">No se pudieron cargar algunos datos. Se muestran valores en caché.</p>
          </div>
        )}
        {rutinas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rutinas.slice(0, 6).map((rutina) => (
              <Link
                key={rutina.id}
                href={`/admin/rutinas/${rutina.id}`}
                className="block bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-4 hover:border-[var(--button-secondary-border)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[var(--foreground)] font-medium">{rutina.nombre}</h3>
                    <p className="text-[var(--muted-foreground)] text-sm mt-1 capitalize">{rutina.tipo}</p>
                  </div>
                  <span className="px-2 py-1 bg-[var(--button-secondary-bg)] rounded text-xs text-[var(--muted-foreground)]">
                    {rutina.diasCount || 0} días
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[var(--button-secondary-bg)]/50 rounded-xl border border-[var(--card-border)]">
            <p className="text-[var(--muted-foreground)]">No hay rutinas creadas aún</p>
            <Link
              href="/admin/rutinas/new"
              className="text-[var(--destructive)] hover:text-[var(--destructive-foreground)] text-sm mt-2 inline-block"
            >
              Crear tu primera rutina →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
