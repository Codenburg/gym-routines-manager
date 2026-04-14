"use client"

import { Edit2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { Promocion } from "@/lib/schemas"

interface PromocionCardProps {
  promocion: Promocion
  isEditing: boolean
  onEdit: (p: Promocion) => void
  onDelete: (id: string) => void
  onToggle: (id: string, activo: boolean) => void
}

function formatPriceARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function PromocionCard({
  promocion,
  isEditing,
  onEdit,
  onDelete,
  onToggle,
}: PromocionCardProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-between rounded-xl border-l-4 border-l-primary border bg-card p-4 shadow-sm transition-all",
        isEditing
          ? "ring-2 ring-primary border-primary/50"
          : "border-border hover:border-ring/50",
        !promocion.activo && "opacity-60"
      )}
    >
      {/* Editing badge */}
      {isEditing && (
        <span className="absolute -top-2 left-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
          Editando
        </span>
      )}

      {/* Content */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-primary font-medium">$</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground font-semibold truncate">{promocion.titulo}</p>
          <p className="text-muted-foreground text-sm truncate">{promocion.descripcion}</p>
          <Badge className="bg-primary/10 text-primary mt-1">
            {formatPriceARS(promocion.precio)}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-4">
        {/* Toggle Switch */}
        <div className="flex items-center gap-2 mr-2">
          <Switch
            checked={promocion.activo}
            onCheckedChange={(checked: boolean) => onToggle(promocion.id, checked)}
            size="lg"
            showLabel
            aria-label={`${promocion.activo ? "Desactivar" : "Activar"} promoción`}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(promocion)}
          className={cn(
            "hover:bg-primary/10",
            isEditing && "bg-primary/10 text-primary"
          )}
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(promocion.id)}
          className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
