import { getPromociones } from '@/lib/promociones';
import { PromocionManager } from '@/components/admin/promocion-manager'
import { PageHeader } from '@/components/admin/page-header'

export default async function PromocionesAdminPage() {
  const promociones = await getPromociones();

  return (
    <div className="container py-8">
      <PageHeader
        title="Promociones"
        description="Gestiona las promociones activas del gimnasio"
      />
      <PromocionManager initialPromociones={promociones} />
    </div>
  )
}