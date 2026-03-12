import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getRutinas } from "@/app/actions/rutinas";
import prisma from "@/lib/prisma";

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

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession();

  if (!session) {
    redirect("/admin/login");
  }

  // Verify admin role
  const user = session.user as { admin?: boolean } | undefined;
  if (!user?.admin) {
    redirect("/");
  }

  const stats = await getStats();
  const rutinas = await getRutinas();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bienvenido al Panel de Administración</h1>
        <p className="text-white/60 mt-1">Gestiona tus rutinas, días y ejercicios desde aquí</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Rutinas</p>
              <p className="text-2xl font-bold text-white">{stats.rutinasCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Días</p>
              <p className="text-2xl font-bold text-white">{stats.diasCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-white/60 text-sm">Total Ejercicios</p>
              <p className="text-2xl font-bold text-white">{stats.ejerciciosCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h2>
        <div className="flex gap-4">
          <Link
            href="/admin/rutinas/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Rutina
          </Link>
          <Link
            href="/admin/rutinas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ver Rutinas
          </Link>
        </div>
      </div>

      {/* Recent Routines */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Rutinas Recientes</h2>
        {rutinas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rutinas.slice(0, 6).map((rutina) => (
              <Link
                key={rutina.id}
                href={`/admin/rutinas/${rutina.id}`}
                className="block bg-zinc-900 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-medium">{rutina.nombre}</h3>
                    <p className="text-white/50 text-sm mt-1 capitalize">{rutina.tipo}</p>
                  </div>
                  <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/70">
                    {rutina.diasCount || 0} días
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-white/10">
            <p className="text-white/50">No hay rutinas creadas aún</p>
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
  );
}
