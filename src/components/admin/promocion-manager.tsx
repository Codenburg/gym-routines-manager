"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createPromocion, updatePromocion, deletePromocion } from "@/app/actions/promociones";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { Plus, Tag, Trash2, Edit2, X, Check } from "lucide-react";
import type { FormState } from "@/lib/schemas";

interface Promocion {
  id: string;
  titulo: string;
  descripcion: string;
  precio: string;
  activo: boolean;
}

interface PromocionManagerProps {
  initialPromociones: Promocion[];
}

export function PromocionManager({ initialPromociones }: PromocionManagerProps) {
  const [promociones, setPromociones] = useState<Promocion[]>(initialPromociones);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state for add/edit
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { confirm, Dialog } = useConfirm();

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setPrecio("");
    setActivo(true);
    setError(null);
  };

  const handleAdd = async () => {
    if (!titulo.trim() || !descripcion.trim() || !precio.trim()) {
      setError("Todos los campos son requeridos");
      return;
    }

    setError(null);
    setIsAdding(true);

    try {
      const formData = new FormData();
      formData.append("titulo", titulo.trim());
      formData.append("descripcion", descripcion.trim());
      formData.append("precio", precio.trim());
      formData.append("activo", activo.toString());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await createPromocion({ success: false }, formData);

      if (result.success && result.data) {
        setPromociones((prev) => [result.data!, ...prev]);
        toast.success("Promoción creada exitosamente");
        resetForm();
        setIsAdding(false);
      } else if (result.errors?._form) {
        toast.error(result.errors._form[0]);
      } else {
        toast.error(result.message || "Error al crear la promoción");
      }
    } catch (err) {
      toast.error("Error al crear la promoción");
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!titulo.trim() || !descripcion.trim() || !precio.trim()) {
      setError("Todos los campos son requeridos");
      return;
    }

    setError(null);

    try {
      const formData = new FormData();
      formData.append("titulo", titulo.trim());
      formData.append("descripcion", descripcion.trim());
      formData.append("precio", precio.trim());
      formData.append("activo", activo.toString());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await updatePromocion(id, { success: false }, formData);

      if (result.success && result.data) {
        setPromociones((prev) =>
          prev.map((p) => (p.id === id ? result.data! : p))
        );
        toast.success("Promoción actualizada exitosamente");
        resetForm();
        setEditingId(null);
      } else if (result.errors?._form) {
        toast.error(result.errors._form[0]);
      } else {
        toast.error(result.message || "Error al actualizar la promoción");
      }
    } catch (err) {
      toast.error("Error al actualizar la promoción");
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "¿Eliminar promoción?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;

    try {
      const result: FormState = await deletePromocion(id);

      if (result.success) {
        setPromociones((prev) => prev.filter((p) => p.id !== id));
        toast.success("Promoción eliminada exitosamente");
      } else {
        toast.error(result.message || "Error al eliminar la promoción");
      }
    } catch (err) {
      toast.error("Error al eliminar la promoción");
      console.error(err);
    }
  };

  const handleToggleActivo = async (id: string, currentActivo: boolean) => {
    try {
      const formData = new FormData();
      formData.append("titulo", ""); // Required but not used for toggle
      formData.append("descripcion", "");
      formData.append("precio", "");
      formData.append("activo", (!currentActivo).toString());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await updatePromocion(id, { success: false }, formData);

      if (result.success && result.data) {
        setPromociones((prev) =>
          prev.map((p) => (p.id === id ? { ...p, activo: result.data!.activo } : p))
        );
        toast.success(result.data.activo ? "Promoción activada" : "Promoción desactivada");
      }
    } catch (err) {
      toast.error("Error al cambiar el estado de la promoción");
      console.error(err);
    }
  };

  const startEditing = (promocion: Promocion) => {
    setTitulo(promocion.titulo);
    setDescripcion(promocion.descripcion);
    setPrecio(promocion.precio);
    setActivo(promocion.activo);
    setEditingId(promocion.id);
    setIsAdding(false);
    setError(null);
  };

  const cancelEditing = () => {
    resetForm();
    setEditingId(null);
  };

  const formatPrice = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <AdminCard variant="standard">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {editingId ? "Editar Promoción" : "Agregar Promoción"}
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <AdminFormField variant="default" label="Título">
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Promoción de Verano"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
            />
          </AdminFormField>

          <AdminFormField variant="default" label="Descripción">
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: 2 meses de matrícula bonificados"
              rows={2}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring resize-none"
            />
          </AdminFormField>

          <div className="flex gap-4 items-end">
            <AdminFormField variant="default" label="Precio">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="text"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-7 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
              </div>
            </AdminFormField>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="activo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <label htmlFor="activo" className="text-sm text-foreground cursor-pointer">
                Activo
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            {editingId ? (
              <>
                <Button onClick={() => handleUpdate(editingId)} disabled={isAdding}>
                  <Check className="w-5 h-5 mr-2" />
                  {isAdding ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button variant="outline" onClick={cancelEditing}>
                  <X className="w-5 h-5 mr-2" />
                  Cancelar
                </Button>
              </>
            ) : (
              <Button onClick={handleAdd} disabled={isAdding}>
                <Plus className="w-5 h-5 mr-2" />
                {isAdding ? "Agregando..." : "Agregar Promoción"}
              </Button>
            )}
          </div>
        </div>
      </AdminCard>

      {/* Lista de Promociones */}
      <AdminCard variant="standard">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Promociones Existentes ({promociones.length})
          </h3>
        </div>
        
        {promociones.length > 0 ? (
          <div className="divide-y divide-border">
            {promociones.map((promocion) => (
              <div
                key={promocion.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-medium">{promocion.titulo}</p>
                      {!promocion.activo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{promocion.descripcion}</p>
                    <p className="text-primary font-medium text-sm mt-1">
                      {formatPrice(promocion.precio)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActivo(promocion.id, promocion.activo)}
                    className={`p-2 rounded-lg transition-colors ${
                      promocion.activo
                        ? "hover:bg-green-500/10 text-green-600"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    title={promocion.activo ? "Desactivar" : "Activar"}
                  >
                    {promocion.activo ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => startEditing(promocion)}
                    className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(promocion.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground text-lg">No hay promociones agregadas</p>
            <p className="text-muted-foreground text-sm mt-2 opacity-60">
              Agrega una promoción usando el formulario de arriba
            </p>
          </div>
        )}
      </AdminCard>
      {Dialog}
    </div>
  );
}
