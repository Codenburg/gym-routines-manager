import Link from "next/link";
import { getRutinas } from "@/app/actions/rutinas";
import prisma from "@/lib/prisma";
import { AuthGuard } from "@/components/auth-guard";
import { GymPriceEditor } from "@/components/admin/GymPriceEditor";
import { FileText, Calendar, TrendingUp, Plus } from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [rutinasCount, diasCount, ejerciciosCount] = await Promise.all([
      prisma.rutina.count(),
      prisma.dia.count(),
      prisma.ejercicio.count(),
    ]);

    return {
      rutinasCount,
      diasCount,
      ejerciciosCount,
    };
  } catch {
    return {
      rutinasCount: 0,
      diasCount: 0,
      ejerciciosCount: 0,
    };
  }
}

async function getGymPrice(): Promise<number> {
  try {
    const gym = await prisma.gym.findUnique({
      where: { id: "gym" },
    });
    // Gym auto-created by API if not exists, but we keep fallback for safety
    return gym ? Number(gym.price) : 45000;
  } catch {
    return 45000;
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const rutinas = await getRutinas();
  const gymPrice = await getGymPrice();

  return (
    <AuthGuard>
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
              <p className="text-2xl font-bold text-[var(--foreground)]">{stats.rutinasCount}</p>
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
              <p className="text-2xl font-bold text-[var(--foreground)]">{stats.diasCount}</p>
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
              <p className="text-2xl font-bold text-[var(--foreground)]">{stats.ejerciciosCount}</p>
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
              className="text-red-500 hover:text-red-400 text-sm mt-2 inline-block"
            >
              Crear tu primera rutina →
            </Link>
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
