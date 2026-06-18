"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createFeriado, deleteFeriado } from "@/app/actions/feriados";
import { getToday } from "@/lib/dates";
import type { FormState } from "@/lib/schemas";
import { Plus, Calendar, Trash2, Clock } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { Button } from "@/components/ui/button";

interface Feriado {
  id: string;
  fecha: string; // YYYY-MM-DD calendar date, not timestamp
  todo_dia: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
}

interface FeriadoManagerProps {
  initialFeriados: Feriado[];
}

export function FeriadoManager({ initialFeriados }: FeriadoManagerProps) {
  const [feriados, setFeriados] = useState<Feriado[]>(initialFeriados);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [isFullDay, setIsFullDay] = useState(true);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { confirm, Dialog } = useConfirm();

  const handleAdd = async () => {
    if (!selectedDate) {
      setError("Por favor selecciona una fecha");
      return;
    }

    // Validate date is not in the past
    if (selectedDate < getToday()) {
      toast.error("No se pueden seleccionar fechas pasadas");
      return;
    }

    // Validate time range when not full day
    if (!isFullDay) {
      if (!horaInicio || !horaFin) {
        setError("Por favor completa ambas horas");
        return;
      }
      if (horaInicio >= horaFin) {
        toast.error("La hora de inicio debe ser menor que la hora de fin");
        return;
      }
    }

    setError(null);
    setIsAdding(true);

    try {
      const formData = new FormData();
      formData.append("fecha", selectedDate);
      formData.append("todo_dia", isFullDay.toString());
      if (!isFullDay) {
        formData.append("hora_inicio", horaInicio);
        formData.append("hora_fin", horaFin);
      }

      const result: FormState<{ id: string }> = await createFeriado({ success: false }, formData);

      if (result.success && result.data?.id) {
        // Refetch feriados - createFeriado already revalidates path
        // For immediate UI update, we can parse the date
        const newFeriado: Feriado = {
          id: result.data?.id || crypto.randomUUID(),
          fecha: selectedDate, // String directly
          todo_dia: isFullDay,
          hora_inicio: isFullDay ? null : horaInicio,
          hora_fin: isFullDay ? null : horaFin,
        };
        setFeriados((prev) => [...prev, newFeriado].sort((a, b) => a.fecha.localeCompare(b.fecha)));
        toast.success("Feriado agregado exitosamente");
        setSelectedDate("");
        setIsFullDay(true);
        setHoraInicio("");
        setHoraFin("");
      } else if (result.statusCode === 409) {
        // Duplicate holiday error
        toast.error("Ya existe un feriado para esta fecha");
      } else {
        toast.error(result.message || "Error al guardar");
      }
    } catch (err) {
      toast.error("Error al agregar feriados");
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line @admin/no-window-alert
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

      const result = await deleteFeriado({ success: false }, formData);

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

  const formatDate = (dateStr: string) => {
    // Convert string to Date using local time to avoid timezone offset
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(`${dateStr}T00:00:00`));
  };

  return (
    <div className="space-y-6">
      {/* Add Holiday Form */}
      <AdminCard variant="standard">
        <h3 className="text-lg font-semibold text-foreground mb-4">Agregar Feriado</h3>
        
        {error && (
          <div
            data-testid="feriado-error"
            className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-4">
          <div className="flex-1">
            <AdminFormField variant="default" label="Fecha del feriado">
              <input
                type="date"
                id="fecha"
                data-testid="feriado-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getToday()}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
              />
            </AdminFormField>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="todo_dia"
              data-testid="feriado-todo-dia-checkbox"
              checked={isFullDay}
              onChange={(e) => setIsFullDay(e.target.checked)}
              className="w-4 h-4 accent-primary rounded"
            />
            <label htmlFor="todo_dia" className="text-sm text-foreground cursor-pointer">
              Día completo
            </label>
          </div>
          {!isFullDay && (
            <>
              <AdminFormField variant="default" label="Hora inicio">
                <input
                  type="time"
                  id="hora_inicio"
                  data-testid="feriado-hora-inicio-input"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
              </AdminFormField>
              <AdminFormField variant="default" label="Hora fin">
                <input
                  type="time"
                  id="hora_fin"
                  data-testid="feriado-hora-fin-input"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
              </AdminFormField>
            </>
          )}
          <Button
            onClick={handleAdd}
            disabled={isAdding}
            data-testid="feriado-submit-button"
          >
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
                data-testid="feriado-list-item"
                className="flex items-center justify-between px-6 py-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{formatDate(feriado.fecha)}</p>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                      {feriado.todo_dia ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          Día completo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          {feriado.hora_inicio} - {feriado.hora_fin}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(feriado.id)}
                  data-testid="feriado-delete-button"
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
