"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createDescuentoDuracion,
  updateDescuentoDuracion,
  deleteDescuentoDuracion,
} from "@/app/actions/descuentos-duracion";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { Plus, Percent, Trash2, Edit2, X, Check } from "lucide-react";
import type { FormState } from "@/lib/schemas";

interface DescuentoDuracion {
  id: number;
  meses: number;
  porcentaje: number;
}

interface DescuentoDuracionManagerProps {
  initialDescuentos: DescuentoDuracion[];
}

const MESES_OPTIONS = [
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 9, label: "9 meses" },
  { value: 12, label: "12 meses" },
];

export function DescuentoDuracionManager({
  initialDescuentos,
}: DescuentoDuracionManagerProps) {
  const [descuentos, setDescuentos] = useState<DescuentoDuracion[]>(
    initialDescuentos
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state for add/edit
  const [meses, setMeses] = useState<number>(3);
  const [porcentaje, setPorcentaje] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { confirm, Dialog } = useConfirm();

  const resetForm = () => {
    setMeses(3);
    setPorcentaje("");
    setError(null);
  };

  const handleAdd = async () => {
    if (!porcentaje.trim()) {
      setError("El porcentaje es requerido");
      return;
    }

    const porcentajeNum = parseInt(porcentaje, 10);
    if (isNaN(porcentajeNum) || porcentajeNum < 0 || porcentajeNum > 100) {
      setError("El porcentaje debe estar entre 0 y 100");
      return;
    }

    setError(null);
    setIsAdding(true);

    try {
      const formData = new FormData();
      formData.append("meses", meses.toString());
      formData.append("porcentaje", porcentaje.trim());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await createDescuentoDuracion(
        { success: false },
        formData
      );

      if (result.success && result.data) {
        setDescuentos((prev) => [...prev, result.data!].sort((a, b) => a.meses - b.meses));
        toast.success("Descuento creado exitosamente");
        resetForm();
        setIsAdding(false);
      } else if (result.errors?.meses) {
        // P2002 unique constraint error - handled by server
        toast.error(result.errors.meses[0]);
      } else if (result.errors?._form) {
        toast.error(result.errors._form[0]);
      } else {
        toast.error(result.message || "Error al crear el descuento");
      }
    } catch {
      toast.error("Error al crear el descuento");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!porcentaje.trim()) {
      setError("El porcentaje es requerido");
      return;
    }

    const porcentajeNum = parseInt(porcentaje, 10);
    if (isNaN(porcentajeNum) || porcentajeNum < 0 || porcentajeNum > 100) {
      setError("El porcentaje debe estar entre 0 y 100");
      return;
    }

    setError(null);

    try {
      const formData = new FormData();
      formData.append("meses", meses.toString());
      formData.append("porcentaje", porcentaje.trim());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await updateDescuentoDuracion(
        id,
        { success: false },
        formData
      );

      if (result.success && result.data) {
        setDescuentos((prev) =>
          prev.map((d) => (d.id === id ? result.data! : d))
        );
        toast.success("Descuento actualizado exitosamente");
        resetForm();
        setEditingId(null);
      } else if (result.errors?.meses) {
        toast.error(result.errors.meses[0]);
      } else if (result.errors?._form) {
        toast.error(result.errors._form[0]);
      } else {
        toast.error(result.message || "Error al actualizar el descuento");
      }
    } catch {
      toast.error("Error al actualizar el descuento");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "¿Eliminar descuento?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;

    try {
      const result: FormState = await deleteDescuentoDuracion(id);

      if (result.success) {
        setDescuentos((prev) => prev.filter((d) => d.id !== id));
        toast.success("Descuento eliminado exitosamente");
      } else {
        toast.error(result.message || "Error al eliminar el descuento");
      }
    } catch {
      toast.error("Error al eliminar el descuento");
    }
  };

  const startEditing = (descuento: DescuentoDuracion) => {
    setMeses(descuento.meses);
    setPorcentaje(descuento.porcentaje.toString());
    setEditingId(descuento.id);
    setIsAdding(false);
    setError(null);
  };

  const cancelEditing = () => {
    resetForm();
    setEditingId(null);
  };

  const getMesesLabel = (mesesValue: number) => {
    const option = MESES_OPTIONS.find((o) => o.value === mesesValue);
    return option ? option.label : `${mesesValue} meses`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Add/Edit Form — separated into distinct layouts */}
      <AdminCard variant="standard">
        {editingId ? (
          /* ========== EDIT MODE ========== */
          <div className="relative">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Editar Descuento
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Grid fijo: select + input + botones en una línea estable */}
            <div className="grid gap-3">
              <div className="flex gap-4 items-end">
                {/* Duración — disabled, sin helper text dentro del flujo */}
                <div className="w-40">
                  <label className="text-muted-foreground text-sm font-medium mb-2 block">
                    Duración
                  </label>
                  <select
                    value={meses}
                    disabled
                    className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                  >
                    {MESES_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Porcentaje */}
                <AdminFormField variant="default" label="Porcentaje de descuento">
                  <div className="relative">
                    <input
                      type="number"
                      value={porcentaje}
                      onChange={(e) => setPorcentaje(e.target.value)}
                      placeholder="10"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 pr-8 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </AdminFormField>

                {/* Botones de acción */}
                <div className="flex gap-2 pb-2">
                  <Button onClick={() => handleUpdate(editingId)} disabled={isAdding}>
                    <Check className="w-5 h-5 mr-2" />
                    {isAdding ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button variant="outline" onClick={cancelEditing}>
                    <X className="w-5 h-5 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>

            {/* Helper text AFUERA del flujo — no causa reflow */}
            <p className="text-xs text-muted-foreground mt-2">
              La duración no se puede cambiar
            </p>
          </div>
        ) : (
          /* ========== CREATE MODE ========== */
          <>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Agregar Descuento por Duración
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4 items-end">
              <AdminFormField variant="default" label="Duración">
                <select
                  value={meses}
                  onChange={(e) => setMeses(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-ring cursor-pointer"
                >
                  {MESES_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </AdminFormField>

              <AdminFormField variant="default" label="Porcentaje de descuento">
                <div className="relative">
                  <input
                    type="number"
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(e.target.value)}
                    placeholder="10"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 pr-8 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </AdminFormField>

              <div className="flex gap-2 pb-2">
                <Button onClick={handleAdd} disabled={isAdding}>
                  <Plus className="w-5 h-5 mr-2" />
                  {isAdding ? "Agregando..." : "Agregar"}
                </Button>
              </div>
            </div>
          </>
        )}
      </AdminCard>

      {/* Lista de Descuentos */}
      <AdminCard variant="standard">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Descuentos por Duración ({descuentos.length})
          </h3>
        </div>

        {descuentos.length > 0 ? (
          <div className="divide-y divide-border">
            {descuentos.map((descuento) => (
              <div
                key={descuento.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Percent className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      {getMesesLabel(descuento.meses)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Descuento del{" "}
                      <span className="text-emerald-600 font-medium">
                        {descuento.porcentaje}%
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => startEditing(descuento)}
                    title="Editar"
                    className="text-muted-foreground hover:text-foreground hover:border-primary/50"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(descuento.id)}
                    title="Eliminar"
                    className="text-muted-foreground hover:text-destructive hover:border-destructive/50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <Percent className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground text-lg">
              No hay descuentos agregados
            </p>
            <p className="text-muted-foreground text-sm mt-2 opacity-60">
              Agrega un descuento usando el formulario de arriba
            </p>
          </div>
        )}
      </AdminCard>
      {Dialog}
    </div>
  );
}
