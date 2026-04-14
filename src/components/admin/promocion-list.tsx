"use client"

import { Tag } from "lucide-react"
import { PromocionCard } from "./promocion-card"
import type { Promocion } from "@/lib/schemas"

interface PromocionListProps {
  promociones: Promocion[]
  editingPromocionId: string | null
  onEdit: (p: Promocion) => void
  onDelete: (id: string) => void
  onToggle: (id: string, activo: boolean) => void
}

export function PromocionList({
  promociones,
  editingPromocionId,
  onEdit,
  onDelete,
  onToggle,
}: PromocionListProps) {
  if (promociones.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
        <p className="text-muted-foreground text-lg">No hay promociones aún</p>
        <p className="text-muted-foreground text-sm mt-2 opacity-60">
          Completá el formulario de la izquierda para crear tu primera promoción
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {promociones.map((promocion) => (
        <PromocionCard
          key={promocion.id}
          promocion={promocion}
          isEditing={editingPromocionId === promocion.id}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}
