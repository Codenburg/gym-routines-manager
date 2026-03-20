"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createDia, updateDia, deleteDia } from "@/app/actions/dias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminFormField } from "@/components/admin/admin-form-field";
import type { FormState } from "@/lib/schemas";
import Link from "next/link";
import { Plus, GripVertical, Pencil, Trash2, ChevronRight } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";

interface Dia {
  id: string;
  nombre: string;
  musculosEnfocados?: string | null;
  orden: number;
  ejercicios: {
    id: string;
    nombre: string;
    series?: string | null;
    repes?: string | null;
  }[];
}

interface DiaManagerProps {
  rutinaId: string;
  dias: Dia[];
}

type DiaFormState = FormState<{ id: string }>;

const initialState: DiaFormState = {
  success: false,
};

// Cast server actions to proper type
const createActionTyped = createDia as unknown as (state: DiaFormState | null, formData: FormData) => Promise<DiaFormState>;
const updateActionTyped = updateDia as unknown as (state: DiaFormState | null, formData: FormData) => Promise<DiaFormState>;
const deleteActionTyped = deleteDia as unknown as (state: DiaFormState | null, formData: FormData) => Promise<DiaFormState>;

export function DiaManager({ rutinaId, dias }: DiaManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { confirm, Dialog } = useConfirm();

  const [createState, createActionWrapped, isCreatePending] = useActionState(createActionTyped, initialState);
  const [updateState, updateActionWrapped, isUpdatePending] = useActionState(updateActionTyped, initialState);
  const [deleteState, deleteActionWrapped, isDeletePending] = useActionState(deleteActionTyped, initialState);

  // Reset states when they succeed
  const handleSuccess = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = async (diaId: string) => {
    const confirmed = await confirm({
      title: "¿Eliminar día?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;
    const formData = new FormData();
    formData.append("id", diaId);
    formData.append("rutinaId", rutinaId);
    await deleteActionTyped(null, formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Días de la Rutina</h2>
          <p className="text-muted-foreground text-sm">Administra los días de entrenamiento</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar Día
        </Button>
      </div>

      {/* Add Day Form */}
      {isAdding && (
        <AdminCard variant="standard">
          <h3 className="text-lg font-semibold text-foreground mb-4">Nuevo Día</h3>
          <form
            action={async (formData: FormData) => {
              formData.set("rutinaId", rutinaId);
              const result = await createActionTyped(null, formData);
              if (result.success) handleSuccess();
            }}
            className="space-y-4"
          >
            <input type="hidden" name="rutinaId" value={rutinaId} />

            {createState && !createState.success && createState.message && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-destructive text-sm">{createState.message}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminFormField variant="default" label="Nombre *" error={createState?.errors?.nombre?.[0]}>
                <Input
                  name="nombre"
                  required
                  placeholder="Ej: Día 1 - Pecho"
                  error={!!createState?.errors?.nombre}
                />
              </AdminFormField>
              <AdminFormField variant="default" label="Músculos Enfocados">
                <Input
                  name="musculosEnfocados"
                  placeholder="Ej: Pecho, tríceps"
                />
              </AdminFormField>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatePending}>
                {isCreatePending ? "Guardando..." : "Crear Día"}
              </Button>
            </div>
          </form>
        </AdminCard>
      )}

      {/* Days List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dias.map((dia, index) => (
          <AdminCard key={dia.id} variant="interactive">
            {/* Drag Handle */}
            <div className="absolute top-4 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm font-mono opacity-60">#{index + 1}</span>
                <h3 className="text-foreground font-medium">{dia.nombre}</h3>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingId(editingId === dia.id ? null : dia.id)}
                  className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(dia.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {dia.musculosEnfocados && (
              <p className="text-muted-foreground text-sm opacity-70 mb-4">{dia.musculosEnfocados}</p>
            )}

            {/* Edit Form */}
            {editingId === dia.id ? (
              <form
                action={async (formData: FormData) => {
                  formData.set("id", dia.id);
                  formData.set("rutinaId", rutinaId);
                  const result = await updateActionTyped(null, formData);
                  if (result.success) setEditingId(null);
                }}
                className="space-y-3"
              >
                <input type="hidden" name="id" value={dia.id} />
                <input type="hidden" name="rutinaId" value={rutinaId} />

                <AdminFormField variant="default" label="Nombre">
                  <Input
                    name="nombre"
                    defaultValue={dia.nombre}
                    required
                    placeholder="Nombre del día"
                  />
                </AdminFormField>

                <AdminFormField variant="default" label="Músculos Enfocados">
                  <Input
                    name="musculosEnfocados"
                    defaultValue={dia.musculosEnfocados || ""}
                    placeholder="Músculos enfocados"
                  />
                </AdminFormField>

                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isUpdatePending}>
                    {isUpdatePending ? "Guardando" : "Guardar"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <Link
                href={`/admin/rutinas/${rutinaId}/dias/${dia.id}`}
                className="block p-3 rounded-lg bg-secondary hover:opacity-80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm opacity-80">
                    {dia.ejercicios.length} ejercicio{dia.ejercicios.length !== 1 ? "s" : ""}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60" />
                </div>
              </Link>
            )}
          </AdminCard>
        ))}

        {dias.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No hay días en esta rutina</p>
            <p className="text-muted-foreground text-sm mt-1 opacity-60">Agrega un día para empezar</p>
          </div>
        )}
      </div>
      {Dialog}
    </div>
  );
}
