"use client"

import { cn } from "@/lib/utils"

interface PromocionStatusBadgeProps {
  activo: boolean
}

export function PromocionStatusBadge({ activo }: PromocionStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        activo
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
      )}
    >
      {activo ? "Activa" : "Inactiva"}
    </span>
  )
}
