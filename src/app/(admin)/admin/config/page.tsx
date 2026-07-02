import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/auth";
import { getAdminSession } from "@/lib/admin-session";
import { getGymDisplayForServerForTenant } from "@/app/actions/gym";
import { GymConfigManager } from "@/components/admin/GymConfigManager";
import { PageHeader } from "@/components/admin/page-header";

/**
 * /admin/config
 *
 * Admin-only configuration page for the active tenant Gym record.
 * - Unauthenticated: redirected to /admin/login by the parent layout.
 * - TRAINER: redirected to "/admin" (REQ-4.1 — gym config is admin-only;
 *   trainers should land on a neutral home, not another admin section).
 * - USER: redirected to "/admin/login" by the parent layout.
 *
 * Reads the current config through `getGymDisplayForServerForTenant`
 * so admin writes and canonical public reads consume the same
 * organization-scoped Gym row.
 */
export default async function AdminConfigPage() {
  // Parent layout already validated the session; this call is memoized
  // per request via React.cache(), so it dedupes with the layout's
  // auth.api.getSession call within the same render pass.
  const session = await getAdminSession();

  // Admin-only guard — TRAINER is redirected to the admin landing page.
  if (!(await isAdmin(await headers()))) {
    redirect("/admin");
  }

  const organizationId = session?.session.activeOrganizationId;
  if (!organizationId) {
    redirect("/admin/login");
  }

  const display = await getGymDisplayForServerForTenant(organizationId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración del Gimnasio"
        description="Editá los datos visibles del gimnasio (nombre, horarios, ubicación y redes)."
        backHref="/admin"
      />

      <GymConfigManager
        initial={{
          nombre: display?.nombre ?? null,
          horarioJson: display?.horarioJson ?? null,
          direccion: display?.direccion ?? null,
          mapsEmbedUrl: display?.mapsEmbedUrl ?? null,
          socialInstagram: display?.socialInstagram ?? null,
          socialWhatsapp: display?.socialWhatsapp ?? null,
        }}
      />
    </div>
  );
}
