"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createFeriado, deleteFeriado } from "@/app/actions/feriados";
import type { FormState } from "@/lib/schemas";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { Button } from "@/components/ui/button";

interface Feriado {
  id: string;
  fecha: Date;
}

interface FeriadoManagerProps {
  initialFeriados: Feriado[];
}

export function FeriadoManager({ initialFeriados }: FeriadoManagerProps) {
  const [feriados, setFeriados] = useState<Feriado[]>(initialFeriados);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { confirm, Dialog } = useConfirm();

  const handleAdd = async () => {
    if (!selectedDate) {
      setError("Por favor selecciona una fecha");
      return;
    }

    setError(null);
    setIsAdding(true);

    try {
      const formData = new FormData();
      formData.append("fecha", selectedDate);

      const result: FormState<{ id: string }> = await createFeriado({ success: false }, formData);

      if (result.success && result.data?.id) {
        // Refetch feriados - createFeriado already revalidates path
        // For immediate UI update, we can parse the date
        const newFeriado: Feriado = {
          id: result.data?.id || crypto.randomUUID(),
          fecha: new Date(selectedDate),
        };
        setFeriados((prev) => [...prev, newFeriado].sort((a, b) => a.fecha.getTime() - b.fecha.getTime()));
        toast.success("Feriado agregado exitosamente");
        setSelectedDate("");
      } else {
        toast.error(result.message || "Error al agregar feriado");
      }
    } catch (err) {
      toast.error("Error al agregar feriados");
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "¿Eliminar feriado?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;

    try {
      const formData = new FormData();
      formData.append("id", id);

      const result: FormState = await deleteFeriado({ success: false }, formData);

      if (result.success) {
        setFeriados((prev) => prev.filter((f) => f.id !== id));
        toast.success("Feriado eliminado exitosamente");
      } else {
        toast.error(result.message || "Error al eliminar feriado");
      }
    } catch (err) {
      toast.error("Error al eliminar feriados");
      console.error(err);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Add Holiday Form */}
      <AdminCard variant="standard">
        <h3 className="text-lg font-semibold text-foreground mb-4">Agregar Feriado</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <AdminFormField variant="default" label="Fecha del feriado">
              <input
                type="date"
                id="fecha"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
              />
            </AdminFormField>
          </div>
          <Button onClick={handleAdd} disabled={isAdding}>
            <Plus className="w-5 h-5 mr-2" />
            {isAdding ? "Agregando..." : "Agregar"}
          </Button>
        </div>
      </AdminCard>

      {/* Holidays List */}
      <AdminCard variant="standard">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Feriados Existentes ({feriados.length})
          </h3>
        </div>
        
        {feriados.length > 0 ? (
          <div className="divide-y divide-border">
            {feriados.map((feriado) => (
              <div
                key={feriado.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{formatDate(feriado.fecha)}</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(feriado.fecha).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(feriado.id)}
                  className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground text-lg">No hay feriados agregados</p>
            <p className="text-muted-foreground text-sm mt-2 opacity-60">Agrega un feriado usando el formulario de arriba</p>
          </div>
        )}
      </AdminCard>
      {Dialog}
    </div>
  );
}
