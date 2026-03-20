"use client";

import { useState } from "react";
import { createFeriado, deleteFeriado } from "@/app/actions/feriados";
import type { FormState } from "@/lib/schemas";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";

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
  const [success, setSuccess] = useState<string | null>(null);
  const { confirm, Dialog } = useConfirm();

  const handleAdd = async () => {
    if (!selectedDate) {
      setError("Por favor selecciona una fecha");
      return;
    }

    setError(null);
    setSuccess(null);
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
        setSuccess("Feriado agregado exitosamente");
        setSelectedDate("");
      } else {
        setError(result.message || "Error al agregar feriado");
      }
    } catch (err) {
      setError("Error al agregar feriado");
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
        setSuccess("Feriado eliminado exitosamente");
      } else {
        setError(result.message || "Error al eliminar feriado");
      }
    } catch (err) {
      setError("Error al eliminar feriado");
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
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Agregar Feriado</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 rounded-lg text-[var(--destructive)] text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-lg text-[var(--success)] text-sm">
            {success}
          </div>
        )}

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="fecha" className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Fecha del feriado
            </label>
            <input
              type="date"
              id="fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--input-foreground)] placeholder:[var(--input-placeholder)] focus:outline-none focus:border-[var(--ring)]"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="px-4 py-2 bg-[var(--button-primary-bg)] hover:opacity-90 disabled:opacity-50 text-[var(--button-primary-foreground)] rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {isAdding ? "Agregando..." : "Agregar"}
          </button>
        </div>
      </div>

      {/* Holidays List */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--card-border)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Feriados Existentes ({feriados.length})
          </h3>
        </div>
        
        {feriados.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {feriados.map((feriado) => (
              <div
                key={feriado.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[var(--accent)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--destructive)]/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[var(--destructive)]" />
                  </div>
                  <div>
                    <p className="text-[var(--foreground)] font-medium">{formatDate(feriado.fecha)}</p>
                    <p className="text-[var(--muted-foreground)] text-sm">
                      {new Date(feriado.fecha).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(feriado.id)}
                  className="p-2 hover:bg-[var(--destructive)]/10 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <Calendar className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4 opacity-20" />
            <p className="text-[var(--muted-foreground)] text-lg">No hay feriados agregados</p>
            <p className="text-[var(--muted-foreground)] text-sm mt-2 opacity-60">Agrega un feriado usando el formulario de arriba</p>
          </div>
        )}
      </div>
      {Dialog}
    </div>
  );
}
