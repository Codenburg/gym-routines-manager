import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Promocion } from "@/app/(public)/informacion/page"

const formatPriceARS = (n: number) => `$ ${n.toLocaleString("es-AR")}`

interface PlansSectionProps {
  promociones: Promocion[]
  error: boolean
}

export function PlansSection({ promociones, error }: PlansSectionProps) {
  if (error) {
    return (
      <p className="text-[var(--muted-foreground)]">
        No se pudieron cargar las promociones
      </p>
    )
  }

  if (promociones.length === 0) {
    return (
      <p className="text-[var(--muted-foreground)]">
        No hay promociones activas
      </p>
    )
  }

  return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {promociones.map((promocion) => (
          <Card
            key={promocion.id}
            className="bg-[var(--background)] border-l-4 border-l-primary border"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[var(--foreground)]">
                {promocion.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)] mb-2">
                {promocion.descripcion}
              </p>
              <Badge className="bg-primary/10 text-primary">
                {formatPriceARS(promocion.precio)}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
  )
}