import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getActiveMemberAuthContext } from "@/lib/auth";
import { getDescuentos } from "@/lib/descuentos";
import { getGymPrice } from "@/lib/gym-price";
import { DescuentoDuracionManager } from "@/components/admin/descuento-duracion-manager";
import { PageHeader } from "@/components/admin/page-header";

export default async function DescuentosDuracionAdminPage() {
  const authContext = await getActiveMemberAuthContext(await headers());
  if (!authContext || (authContext.role !== "admin" && authContext.role !== "trainer")) {
    notFound();
  }

  const [descuentos, gymPrice] = await Promise.all([
    getDescuentos(authContext.activeOrganizationId),
    getGymPrice(authContext.activeOrganizationId),
  ]);

  return (
    <div className="container py-8">
      <PageHeader
        title="Descuentos por Duración"
        description="Gestiona los descuentos según la duración de suscripción"
      />
      <DescuentoDuracionManager
        initialDescuentos={descuentos}
        initialGymPrice={gymPrice}
      />
    </div>
  );
}
