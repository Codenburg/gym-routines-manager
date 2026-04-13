import prisma from '@/lib/prisma';
import { DescuentoDuracionManager } from '@/components/admin/descuento-duracion-manager'
import { PageHeader } from '@/components/admin/page-header'

export default async function DescuentosDuracionAdminPage() {
  const descuentos = await prisma.descuentoDuracion.findMany({
    orderBy: { meses: 'asc' }
  });

  return (
    <div className="container py-8">
      <PageHeader
        title="Descuentos por Duración"
        description="Gestiona los descuentos según la duración de suscripción"
      />
      <DescuentoDuracionManager initialDescuentos={descuentos} />
    </div>
  )
}