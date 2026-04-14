"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  createPromocion,
  deletePromocion,
  togglePromocionActivo,
  updatePromocionContent,
  updatePromocionPrecio,
} from "@/app/actions/promociones"
import { AdminCard } from "@/components/admin/admin-card"
import { PromocionForm } from "@/components/admin/promocion-form"
import { PromocionList } from "@/components/admin/promocion-list"
import { useConfirm } from "@/hooks/use-confirm"
import type { Promocion, PromocionFormState } from "@/lib/schemas"

interface PromocionManagerProps {
  initialPromociones: Promocion[]
}

export function PromocionManager({ initialPromociones }: PromocionManagerProps) {
  const [promociones, setPromociones] = useState<Promocion[]>(initialPromociones)
  const [editingPromocionId, setEditingPromocionId] = useState<string | null>(null)

  const { confirm, Dialog } = useConfirm()

  const editingPromocion = editingPromocionId
    ? promociones.find((p) => p.id === editingPromocionId) || null
    : null

  const handleEdit = (promocion: Promocion) => {
    setEditingPromocionId(promocion.id)
  }

  const handleCancel = () => {
    setEditingPromocionId(null)
  }

  const handleSubmitContent = async (data: { id: string; titulo: string; descripcion?: string }) => {
    const result = await updatePromocionContent(data)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    if (result.data) {
      setPromociones((prev) =>
        prev.map((p) => (p.id === result.data!.id ? { ...p, ...result.data! } : p))
      )
    }

    return { success: true }
  }

  const handleSubmitPrecio = async (data: { id: string; precio: number }) => {
    const result = await updatePromocionPrecio(data)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    if (result.data) {
      setPromociones((prev) =>
        prev.map((p) => (p.id === result.data!.id ? { ...p, ...result.data! } : p))
      )
    }

    return { success: true }
  }

  const handleSubmitCreate = async (data: { titulo: string; descripcion: string; precio: number }) => {
    const formData = new FormData()
    formData.append("titulo", data.titulo)
    formData.append("descripcion", data.descripcion)
    formData.append("precio", data.precio.toString())
    formData.append("activo", "true")

    const result = await createPromocion({ success: false } as PromocionFormState, formData) as PromocionFormState

    if (result.success && result.data) {
      setPromociones((prev) => [result.data!, ...prev])
      return { success: true }
    }

    const errorMsg = result.errors?._form?.[0] || result.message || "Error al crear la promoción"
    return { success: false, error: errorMsg }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "¿Eliminar promoción?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: "Eliminar",
    })
    if (!confirmed) return

    try {
      const result = await deletePromocion(id)

      if (result.success) {
        setPromociones((prev) => prev.filter((p) => p.id !== id))
        if (editingPromocionId === id) {
          setEditingPromocionId(null)
        }
        toast.success("Promoción eliminada exitosamente")
      } else {
        toast.error(result.errors?._form?.[0] || "Error al eliminar la promoción")
      }
    } catch {
      toast.error("Error al eliminar la promoción")
    }
  }

  const handleToggle = async (id: string, activo: boolean) => {
    try {
      const result = await togglePromocionActivo({ id, activo })

      if (result.error) {
        return
      }

      if (result.data) {
        setPromociones((prev) =>
          prev.map((p) => (p.id === result.data!.id ? { ...p, ...result.data! } : p))
        )
      }
    } catch {
      // Error already handled by toast in togglePromocionActivo
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column: Form */}
      <div>
        <AdminCard variant="standard">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {editingPromocionId ? "Editar Promoción" : "Agregar Promoción"}
          </h3>

          <PromocionForm
            editingPromocion={editingPromocion}
            onSubmitContent={handleSubmitContent}
            onSubmitPrecio={handleSubmitPrecio}
            onSubmitCreate={handleSubmitCreate}
            onCancel={handleCancel}
          />
        </AdminCard>
      </div>

      {/* Right column: List */}
      <div>
        <AdminCard variant="standard">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Promociones Existentes ({promociones.length})
            </h3>
          </div>

          <div className="p-4">
            <PromocionList
              promociones={promociones}
              editingPromocionId={editingPromocionId}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          </div>
        </AdminCard>
      </div>

      {Dialog}
    </div>
  )
}
