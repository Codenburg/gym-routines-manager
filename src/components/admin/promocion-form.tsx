"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  createPromocionSchema,
  updatePromocionContentSchema,
  updatePromocionPrecioSchema,
  type Promocion,
  type UpdatePromocionContentInput,
  type UpdatePromocionPrecioInput,
} from "@/lib/schemas"
import { cn } from "@/lib/utils"

interface PromocionFormProps {
  editingPromocion: Promocion | null
  onSubmitContent: (data: UpdatePromocionContentInput) => Promise<{ success: boolean; error?: string }>
  onSubmitPrecio: (data: UpdatePromocionPrecioInput) => Promise<{ success: boolean; error?: string }>
  onSubmitCreate: (data: { titulo: string; descripcion: string; precio: number }) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
}

function formatPriceARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function PromocionForm({
  editingPromocion,
  onSubmitContent,
  onSubmitPrecio,
  onSubmitCreate,
  onCancel,
}: PromocionFormProps) {
  const isEditing = editingPromocion !== null

  const form = useForm({
    resolver: zodResolver(createPromocionSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      precio: undefined,
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, watch } = form

  // Helper type for field errors from react-hook-form
  type FieldError = { message: string }
  const errorsMap = errors as Record<string, FieldError>

  // Reset form when editingPromocion changes — only depends on id to avoid stale closures
  useEffect(() => {
    if (!editingPromocion) {
      // Cancelar: resetear a valores por defecto (formulario vacío)
      reset({
        titulo: "",
        descripcion: "",
        precio: undefined,
      })
      return
    }
    reset({
      titulo: editingPromocion.titulo,
      descripcion: editingPromocion.descripcion || "",
      precio: editingPromocion.precio,
    })
  }, [editingPromocion?.id, reset])

  // Watch precio for ARS display - precio is tracked separately when editing content
  // When editing, updatePromocionContentSchema doesn't include precio, so watch returns unknown
  const precioValue = watch("precio") as number | undefined | null

  const onSubmit = async (data: { titulo: string; descripcion?: string; precio?: number }) => {
    if (isEditing && editingPromocion) {
      // Submit content update (precio is NOT part of content schema)
      const contentResult = await onSubmitContent({
        id: editingPromocion.id,
        titulo: data.titulo,
        descripcion: data.descripcion,
      })

      if (!contentResult.success) {
        toast.error(contentResult.error || "Error al actualizar")
        return
      }

      // If precio changed, submit precio update separately
      if (data.precio !== undefined && data.precio !== editingPromocion.precio) {
        const precioResult = await onSubmitPrecio({
          id: editingPromocion.id,
          precio: data.precio,
        })

        if (!precioResult.success) {
          toast.error(precioResult.error || "Error al actualizar el precio")
          return
        }
      }

      toast.success("Promoción actualizada exitosamente")
      onCancel()
    } else {
      // Create new promocion
      const result = await onSubmitCreate({
        titulo: data.titulo,
        descripcion: data.descripcion || "",
        precio: data.precio ?? 0,
      })

      if (!result.success) {
        toast.error(result.error || "Error al crear la promoción")
        return
      }

      toast.success("Promoción creada exitosamente")
      reset()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Titulo */}
      <div className="space-y-1.5">
        <label htmlFor="titulo" className="text-sm font-medium text-foreground">
          Título
        </label>
        <Input
          id="titulo"
          placeholder="Ej: Promoción de Verano"
          {...register("titulo")}
          aria-invalid={!!errors.titulo}
        />
        {errors.titulo && (
          <p className="text-xs text-destructive">{errors.titulo.message}</p>
        )}
      </div>

      {/* Descripcion */}
      <div className="space-y-1.5">
        <label htmlFor="descripcion" className="text-sm font-medium text-foreground">
          Descripción
        </label>
        <Textarea
          id="descripcion"
          placeholder="Ej: 2 meses de matrícula bonificados"
          rows={2}
          {...register("descripcion")}
          aria-invalid={!!errors.descripcion}
        />
        {errors.descripcion && (
          <p className="text-xs text-destructive">{errors.descripcion.message}</p>
        )}
      </div>

      {/* Precio */}
      <div className="space-y-1.5">
        <label htmlFor="precio" className="text-sm font-medium text-foreground">
          Precio (ARS)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            id="precio"
            type="number"
            min="0"
            step="1"
            placeholder="5000"
            className="pl-7"
            {...register("precio", { valueAsNumber: true })}
            aria-invalid={!!errorsMap.precio}
          />
        </div>
        {errorsMap.precio && (
          <p className="text-xs text-destructive">{errorsMap.precio.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        {isEditing ? (
          <>
            <Button type="submit" disabled={isSubmitting}>
              <Check className="w-4 h-4 mr-2" />
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            <Check className="w-4 h-4 mr-2" />
            {isSubmitting ? "Creando..." : "Crear Promoción"}
          </Button>
        )}
      </div>
    </form>
  )
}
