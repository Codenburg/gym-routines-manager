import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getActiveMemberAuthContext } from "@/lib/auth";
import { getRutinas, getStats } from "@/lib/rutinas";
import { getGymPrice } from "@/lib/gym-price";
import { GymPriceEditor } from "@/components/admin/GymPriceEditor";
import { AdminCard } from "@/components/admin/admin-card";
import { PageHeader } from "@/components/admin/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { FileText, Calendar, TrendingUp } from "lucide-react";

/**
 * Admin dashboard.
 *
 * The three parallel reads (stats, rutinas, gymPrice) are wrapped in a
 * try/catch because any of them can fail independently — a single
 * failed read should not crash the whole dashboard. On failure, the
 * page renders an inline error state with safe defaults rather than
 * throwing (the dashboard is the most-frequented admin page; better
 * degraded than blank).
 *
 * Resolves GGA-FOLLOWUP-1 (Promise.all without error boundary).
 */
export default async function AdminDashboardPage() {
  const authContext = await getActiveMemberAuthContext(await headers());
  if (!authContext || (authContext.role !== "admin" && authContext.role !== "trainer")) {
    notFound();
  }

  const ownerId = authContext.role === "trainer" ? authContext.session.user.id : undefined;
  let stats, rutinas, gymPrice;
  try {
    [stats, rutinas, gymPrice] = await Promise.all([
      getStats(authContext.activeOrganizationId, ownerId),
      getRutinas(authContext.activeOrganizationId, ownerId),
      getGymPrice(authContext.activeOrganizationId),
    ]);
  } catch (error) {
    console.error("[AdminDashboardPage] failed to load dashboard data:", error);
    return (
      <div className="space-y-8">
        <PageHeader title="Panel de Administración" />
        <ErrorState message="No se pudo cargar el panel. Reintentá en unos segundos." />
      </div>
    );
  }

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
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-muted-foreground" />
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
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-muted-foreground" />
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
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
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
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                        {rutina.tipo}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {rutina.diasCount === 1 ? "1 día" : `${rutina.diasCount || 0} días`}
                      </span>
                    </div>
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
