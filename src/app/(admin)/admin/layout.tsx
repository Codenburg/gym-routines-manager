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
 * 3. Si no es admin → redirect("/") - NO renderiza nada
 * 4. Solo si pasa validación → renderizar AdminLayoutComponent (client)
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminLayout as AdminLayoutComponent } from "@/components/admin/admin-layout";

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

  // Verificar rol de admin
  const user = session.user as { admin?: boolean; name?: string } | undefined;
  if (!user?.admin) {
    // No es admin → redirect al home, NO revela la existencia de admin
    redirect("/");
  }

  // Sesión válida y es admin → renderizar con el layout de admin
  // El AdminLayoutComponent es un Client Component para el dropdown, etc.
  // Pero ya está validado que el usuario tiene permisos
  return (
    <AdminLayoutComponent username={user.name || "Admin"}>
      {children}
    </AdminLayoutComponent>
  );
}
