"use client"

import * as React from "react"
import { useEffect } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Eye, EyeOff, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createTrainerSchema,
  updateTrainerSchema,
  type CreateTrainerInput,
  type UpdateTrainerInput,
} from "@/lib/schemas/trainers"

export interface Trainer {
  id: string
  username: string | null
  name: string
  createdAt: Date
}

export interface TrainerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  trainer?: Trainer | null
  onSuccess?: (trainer: Trainer) => void
}

export function TrainerDialog({
  open,
  onOpenChange,
  mode,
  trainer,
  onSuccess,
}: TrainerDialogProps) {
  const isEditing = mode === "edit"
  const [showCreatePassword, setShowCreatePassword] = React.useState(false)
  const [showEditPassword, setShowEditPassword] = React.useState(false)

  const createForm = useForm<CreateTrainerInput>({
    resolver: zodResolver(createTrainerSchema),
    defaultValues: { username: "", name: "", password: "" },
  })

  const updateForm = useForm<UpdateTrainerInput>({
    resolver: zodResolver(updateTrainerSchema),
    defaultValues: { name: "", password: undefined },
  })

  // Reset form when mode or trainer changes
  useEffect(() => {
    if (!open) return

    if (isEditing && trainer) {
      updateForm.reset({ name: trainer.name, password: undefined })
    } else {
      createForm.reset({ username: "", name: "", password: "" })
    }
  }, [open, isEditing, trainer, createForm, updateForm])

  const handleCreateSubmit = async (data: CreateTrainerInput) => {
    try {
      const { createTrainer } = await import("@/app/actions/trainers")
      const formData = new FormData()
      formData.append("username", data.username)
      formData.append("name", data.name)
      formData.append("password", data.password)

      const result = await createTrainer({ success: false }, formData)

      if (!result.success) {
        const errorMsg =
          result.errors?.username?.[0] ||
          result.errors?.name?.[0] ||
          result.errors?.password?.[0] ||
          result.message ||
          "Error al crear el entrenador"
        toast.error(errorMsg)
        return
      }

      if (result.data) {
        toast.success("Entrenador creado exitosamente")
        onSuccess?.({
          id: result.data.id,
          username: result.data.username,
          name: result.data.name,
          createdAt: new Date(),
        })
      }

      onOpenChange(false)
    } catch {
      toast.error("Error inesperado")
    }
  }

  const handleUpdateSubmit = async (data: UpdateTrainerInput) => {
    if (!trainer) return

    try {
      const { updateTrainer } = await import("@/app/actions/trainers")
      const updateData: { name?: string; password?: string } = {}
      if (data.name) updateData.name = data.name
      if (data.password) updateData.password = data.password

      const result = await updateTrainer(trainer.id, updateData)

      if (!result.success) {
        toast.error(result.message)
        return
      }

      toast.success("Entrenador actualizado exitosamente")
      onSuccess?.({
        ...trainer,
        name: data.name || trainer.name,
      })

      onOpenChange(false)
    } catch {
      toast.error("Error inesperado")
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-background p-6 ring-1 ring-foreground/10 shadow-lg duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          {isEditing ? (
            <form
              onSubmit={updateForm.handleSubmit(handleUpdateSubmit)}
              className="space-y-4"
            >
              <DialogPrimitive.Title className="font-heading text-base font-medium text-foreground">
                Editar Entrenador
              </DialogPrimitive.Title>

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="edit-name" className="text-sm font-medium text-foreground">
                  Nombre completo
                </label>
                <Input
                  id="edit-name"
                  placeholder="Juan Pérez"
                  {...updateForm.register("name")}
                  aria-invalid={!!updateForm.formState.errors.name}
                />
                {updateForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {updateForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Password (optional) */}
              <div className="space-y-1.5">
                <label htmlFor="edit-password" className="text-sm font-medium text-foreground">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Dejar vacío para no cambiar"
                    {...updateForm.register("password")}
                    aria-invalid={!!updateForm.formState.errors.password}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {updateForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {updateForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={updateForm.formState.isSubmitting}>
                  <Check className="w-4 h-4 mr-2" />
                  {updateForm.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={createForm.handleSubmit(handleCreateSubmit)}
              className="space-y-4"
            >
              <DialogPrimitive.Title className="font-heading text-base font-medium text-foreground">
                Crear Entrenador
              </DialogPrimitive.Title>

{/* Username (DNI) */}
                <div className="space-y-1.5">
                  <label htmlFor="create-username" className="text-sm font-medium text-foreground">
                    DNI
                  </label>
                  <Input
                    id="create-username"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{0,8}"
                    placeholder="12345678"
                    maxLength={8}
                    {...createForm.register("username")}
                    aria-invalid={!!createForm.formState.errors.username}
                  />
                {createForm.formState.errors.username && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="create-name" className="text-sm font-medium text-foreground">
                  Nombre completo
                </label>
                <Input
                  id="create-name"
                  placeholder="Juan Pérez"
                  {...createForm.register("name")}
                  aria-invalid={!!createForm.formState.errors.name}
                />
                {createForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="create-password" className="text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showCreatePassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    {...createForm.register("password")}
                    aria-invalid={!!createForm.formState.errors.password}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {createForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={createForm.formState.isSubmitting}>
                  <Check className="w-4 h-4 mr-2" />
                  {createForm.formState.isSubmitting ? "Creando..." : "Crear Entrenador"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
