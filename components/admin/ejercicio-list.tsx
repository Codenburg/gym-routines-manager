"use client";

import { useState } from "react";
import { useActionState } from "react";
import { deleteEjercicio } from "@/app/actions/ejercicios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormState } from "@/lib/schemas";
import { EjercicioForm } from "./ejercicio-form";

interface Ejercicio {
  id: string;
  nombre: string;
  series?: string | null;
  repes?: string | null;
  orden: number;
}

interface EjercicioListProps {
  diaId: string;
  diaNombre: string;
  rutinaId: string;
  ejercicios: Ejercicio[];
}

type EjercicioFormState = FormState<{ id: string }>;

const initialState: EjercicioFormState = {
  success: false,
};

const deleteActionTyped = deleteEjercicio as unknown as (state: EjercicioFormState | null, formData: FormData) => Promise<EjercicioFormState>;

export function EjercicioList({ diaId, diaNombre, rutinaId, ejercicios }: EjercicioListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteState, deleteActionWrapped, isDeletePending] = useActionState(deleteActionTyped, initialState);

  const handleDelete = async (ejercicioId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este ejercicio?")) return;
    const formData = new FormData();
    formData.append("id", ejercicioId);
    await deleteActionTyped(null, formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{diaNombre}</h2>
          <p className="text-white/60 text-sm">Administra los ejercicios del día</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Ejercicio
        </Button>
      </div>

      {/* Add Exercise Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Ejercicio</CardTitle>
          </CardHeader>
          <CardContent>
            <EjercicioForm
              diaId={diaId}
              onSuccess={() => setIsAdding(false)}
              onCancel={() => setIsAdding(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Exercises List */}
      <div className="space-y-3">
        {ejercicios.map((ejercicio, index) => (
          <Card key={ejercicio.id} className="relative group">
            {/* Drag Handle */}
            <div className="absolute top-1/2 left-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
              <svg className="w-5 h-5 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </div>

            <CardContent className="flex items-center justify-between py-4 pl-10">
              {editingId === ejercicio.id ? (
                <div className="flex-1">
                  <EjercicioForm
                    initialData={{
                      id: ejercicio.id,
                      nombre: ejercicio.nombre,
                      series: ejercicio.series || undefined,
                      repes: ejercicio.repes || undefined,
                    }}
                    diaId={diaId}
                    onSuccess={() => setEditingId(null)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-white/40 text-sm font-mono">#{index + 1}</span>
                    <div>
                      <h3 className="text-white font-medium">{ejercicio.nombre}</h3>
                      <div className="flex gap-3 text-white/50 text-sm">
                        {ejercicio.series && <span>Series: {ejercicio.series}</span>}
                        {ejercicio.repes && <span>Repes: {ejercicio.repes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(editingId === ejercicio.id ? null : ejercicio.id)}
                      className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(ejercicio.id)}
                      className="p-1.5 rounded hover:bg-red-900/30 text-white/60 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {ejercicios.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/50">No hay ejercicios en este día</p>
            <p className="text-white/40 text-sm mt-1">Agrega un ejercicio para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
}