"use client";

import { useState } from "react";
import { createFeriado, deleteFeriado } from "@/app/actions/feriados";
import type { FormState } from "@/lib/schemas";
import { Plus, Calendar, Trash2 } from "lucide-react";

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
    if (!confirm("¿Estás seguro de que quieres eliminar este feriado?")) {
      return;
    }

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
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Agregar Feriado</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="fecha" className="block text-sm font-medium text-white/70 mb-2">
              Fecha del feriado
            </label>
            <input
              type="date"
              id="fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {isAdding ? "Agregando..." : "Agregar"}
          </button>
        </div>
      </div>

      {/* Holidays List */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">
            Feriados Existentes ({feriados.length})
          </h3>
        </div>
        
        {feriados.length > 0 ? (
          <div className="divide-y divide-white/5">
            {feriados.map((feriado) => (
              <div
                key={feriado.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{formatDate(feriado.fecha)}</p>
                    <p className="text-white/50 text-sm">
                      {new Date(feriado.fecha).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(feriado.id)}
                  className="p-2 hover:bg-red-900/30 rounded-lg text-white/60 hover:text-red-400 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg">No hay feriados agregados</p>
            <p className="text-white/40 text-sm mt-2">Agrega un feriado usando el formulario de arriba</p>
          </div>
        )}
      </div>
    </div>
  );
}
