import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Promocion } from "@/app/g/[orgSlug]/informacion/page"
import { formatPriceARS } from "@/lib/format"

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
            className="bg-card shadow-none"
            style={{ borderLeft: "4px solid var(--primary)" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[var(--foreground)]">
                {promocion.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {promocion.descripcion}
              </p>
              <Badge variant="outline" className="border-primary/30" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                {formatPriceARS(promocion.precio)}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
  )
}
