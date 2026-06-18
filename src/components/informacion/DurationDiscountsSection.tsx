"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DescuentoDuracion } from "@/app/(public)/informacion/page"
import { formatPriceARS } from "@/lib/format"

interface DurationDiscountsSectionProps {
  descuentos: DescuentoDuracion[]
  error: boolean
  /**
   * Current `Gym.price` used to compute the final price for each row
   * (`price * (1 - porcentaje/100)`). When `null`, every row in the
   * "Precio final" column renders the em dash `"—"`. The column is
   * always visible (no layout shift on null).
   */
  price: number | null
}

export function DurationDiscountsSection({
  descuentos,
  error,
  price,
}: DurationDiscountsSectionProps) {
  if (error) {
    return (
      <p className="text-[var(--muted-foreground)]">
        No se pudieron cargar los descuentos
      </p>
    )
  }

  if (descuentos.length === 0) {
    return (
      <p className="text-[var(--muted-foreground)]">
        No hay descuentos disponibles
      </p>
    )
  }

    return (
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--background)] hover:bg-[var(--background)]">
              <TableHead className="text-[var(--foreground)] font-medium">
                Duración
              </TableHead>
              <TableHead className="text-[var(--foreground)] font-medium text-right">
                Descuento
              </TableHead>
              <TableHead className="text-[var(--foreground)] font-medium text-right">
                Precio final
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {descuentos.map((descuento) => (
              <TableRow
                key={descuento.id}
                className="hover:bg-[var(--button-secondary-bg)]"
              >
                <TableCell className="text-[var(--foreground)]">
                  {descuento.meses} {descuento.meses === 1 ? "mes" : "meses"}
                </TableCell>
                <TableCell className="text-right font-semibold text-[var(--foreground)]">
                  {descuento.porcentaje}%
                </TableCell>
                <TableCell
                  data-testid="dur-discount-precio-final"
                  className="text-right font-semibold text-[var(--foreground)]"
                >
                  {price === null
                    ? "—"
                    : formatPriceARS(price * (1 - descuento.porcentaje / 100))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  )
}