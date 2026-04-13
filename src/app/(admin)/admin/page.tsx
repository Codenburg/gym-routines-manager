import Link from "next/link";
import { getRutinas, getStats } from "@/lib/rutinas";
import prisma from "@/lib/prisma";
import { GymPriceEditor } from "@/components/admin/GymPriceEditor";
import { AdminCard } from "@/components/admin/admin-card";
import { PageHeader } from "@/components/admin/page-header";
import { DataResult, ok, err } from "@/lib/data-result";
import { FileText, Calendar, TrendingUp, AlertCircle } from "lucide-react";

// Force dynamic rendering
export const dynamic = "force-dynamic";

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
  const [stats, rutinas, gymPriceResult] = await Promise.all([
    getStats(),
    getRutinas(),
    getGymPrice(),
  ]);

  const gymPrice = gymPriceResult.data;
  const hasError = gymPriceResult.error;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader title="Panel de Administración" />

      {/* Gym Price Editor */}
      <GymPriceEditor initialPrice={gymPrice} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminCard variant="standard">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Rutinas</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.rutinasCount}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard variant="standard">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Días</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.diasCount}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard variant="standard">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Ejercicios</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.ejerciciosCount}
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Recent Routines */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Rutinas Recientes</h2>
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
              >
                <AdminCard variant="interactive">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-foreground font-medium">{rutina.nombre}</h3>
                      <p className="text-muted-foreground text-sm mt-1 capitalize">{rutina.tipo}</p>
                    </div>
                    <span className="px-2 py-1 bg-secondary rounded text-xs text-muted-foreground">
                      {rutina.diasCount || 0} días
                    </span>
                  </div>
                </AdminCard>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-xl border border-border">
            <p className="text-muted-foreground">No hay rutinas creadas aún</p>
            <Link
              href="/admin/rutinas/new"
              className="text-destructive hover:text-destructive/80 text-sm mt-2 inline-block"
            >
              Crear tu primera rutina →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
