/**
 * Admin Layout - Server Component
 *
 * Este layout es la ÚNICA fuente de verdad para la autenticación.
 * Aquí se valida la sesión ANTES de renderizar CUALQUIER componente.
 *
 * NO hay "use client" aquí - esto es SERVER-SIDE ONLY.
 *
 * Flujo de validación:
 * 1. Obtener sesión con auth.api.getSession({ headers })
 * 2. Si no hay sesión → redirect("/admin/login") - NO renderiza nada
 * 3. Si no es admin ni trainer → redirect("/admin/login") - NO renderiza nada
 * 4. Solo si pasa validación → renderizar AdminLayoutComponent (client)
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth, isAdminOrTrainer, getActiveMemberRole } from "@/lib/auth";
import { AdminLayout as AdminLayoutComponent } from "@/components/admin/admin-layout";
import { getGymNameForServerForTenant } from "@/app/actions/gym";
import { resolveGymName } from "@/lib/gym-display";
import { getPublicHrefForOrganization } from "@/lib/tenants/resolve";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Obtener headers de la request para validar sesión
  const headersList = await headers();

  // Validar sesión en el SERVER - esto consulta la base de datos
  const session = await auth.api.getSession({
    headers: headersList,
  });

  // Si NO hay sesión válida → redirect INMEDIATO, no se renderiza nada
  if (!session) {
    redirect("/admin/login");
  }

  // Verificar rol: solo ADMIN o TRAINER pueden acceder al panel de admin
  // Trainers necesitan acceso para gestionar sus rutinas
  if (!(await isAdminOrTrainer(headersList))) {
    // No es admin ni trainer → redirect to the auth boundary, not a legacy public URL.
    redirect("/admin/login");
  }

  // Resolve gym name via the same DB → env → "Gimnasio" chain used by
  // the root metadata and the public homepage. Wrapped in try/catch so
  // a DB outage falls through to the env/chain default instead of
  // failing the admin layout render.
  let gymName: string;
  try {
    const dbName = session.session.activeOrganizationId
      ? await getGymNameForServerForTenant(session.session.activeOrganizationId)
      : null;
    gymName = resolveGymName(dbName);
  } catch {
    gymName = resolveGymName(null);
  }

  // Resolve Member.role for the client-side sidebar nav filter.
  // By this point isAdminOrTrainer has confirmed a valid role exists,
  // but be defensive in case DB state changed mid-request.
  const memberRole = await getActiveMemberRole(headersList);
  const publicSiteHref = session.session.activeOrganizationId
    ? await getPublicHrefForOrganization(session.session.activeOrganizationId)
    : null;

  // Sesión válida y tiene rol permitido → renderizar con el layout de admin
  // El AdminLayoutComponent es un Client Component para el dropdown, etc.
  // Pero ya está validado que el usuario tiene permisos
  return (
    <AdminLayoutComponent
      username={session.user.name || "Admin"}
      role={memberRole ?? undefined}
      gymName={gymName}
      publicSiteHref={publicSiteHref}
    >
      {children}
    </AdminLayoutComponent>
  );
}
