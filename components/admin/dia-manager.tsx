"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createDia, updateDia, deleteDia } from "@/app/actions/dias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FormState } from "@/lib/schemas";
import Link from "next/link";

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

  const [createState, createActionWrapped, isCreatePending] = useActionState(createActionTyped, initialState);
  const [updateState, updateActionWrapped, isUpdatePending] = useActionState(updateActionTyped, initialState);
  const [deleteState, deleteActionWrapped, isDeletePending] = useActionState(deleteActionTyped, initialState);

  // Reset states when they succeed
  const handleSuccess = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = async (diaId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este día?")) return;
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
          <h2 className="text-xl font-semibold text-white">Días de la Rutina</h2>
          <p className="text-white/60 text-sm">Administra los días de entrenamiento</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Día
        </Button>
      </div>

      {/* Add Day Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Día</CardTitle>
          </CardHeader>
          <CardContent>
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
                <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                  <p className="text-red-400 text-sm">{createState.message}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Nombre *</label>
                  <Input
                    name="nombre"
                    required
                    placeholder="Ej: Día 1 - Pecho"
                    error={!!createState?.errors?.nombre}
                  />
                  {createState?.errors?.nombre && (
                    <p className="text-red-500 text-xs">{createState.errors.nombre[0]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Músculos Enfocados</label>
                  <Input
                    name="musculosEnfocados"
                    placeholder="Ej: Pecho, tríceps"
                  />
                </div>
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
          </CardContent>
        </Card>
      )}

      {/* Days List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dias.map((dia, index) => (
          <Card key={dia.id} className="relative group">
            {/* Drag Handle */}
            <div className="absolute top-4 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
              <svg className="w-5 h-5 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-sm font-mono">#{index + 1}</span>
                  <CardTitle className="text-lg">{dia.nombre}</CardTitle>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(editingId === dia.id ? null : dia.id)}
                    className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(dia.id)}
                    className="p-1.5 rounded hover:bg-red-900/30 text-white/60 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              {dia.musculosEnfocados && (
                <p className="text-white/50 text-sm">{dia.musculosEnfocados}</p>
              )}
            </CardHeader>

            <CardContent>
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

                  <Input
                    name="nombre"
                    defaultValue={dia.nombre}
                    required
                    placeholder="Nombre del día"
                  />

                  <Input
                    name="musculosEnfocados"
                    defaultValue={dia.musculosEnfocados || ""}
                    placeholder="Músculos enfocados"
                  />

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
                  className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">
                      {dia.ejercicios.length} ejercicio{dia.ejercicios.length !== 1 ? "s" : ""}
                    </span>
                    <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}

        {dias.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-white/50">No hay días en esta rutina</p>
            <p className="text-white/40 text-sm mt-1">Agrega un día para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
}