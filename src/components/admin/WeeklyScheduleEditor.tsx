"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { updateGymField } from "@/app/actions/gym";
import { AdminCard } from "@/components/admin/admin-card";
import { DumbbellSpinner } from "@/components/ui/dumbbell-spinner";
import { Switch } from "@/components/ui/switch";
import type { FormState, GymField, HorarioDia, HorarioSemanal } from "@/lib/schemas";

/**
 * Stable ordering and labels for the 7 day cards. The codes (`lun`, `mar`,
 * `mie`, ...) MUST match the keys of `HorarioSemanal` exactly — the form
 * submits the full object keyed by these codes, and Zod's horarioSemanalSchema
 * expects them verbatim.
 */
const DAYS: ReadonlyArray<{
  code: keyof HorarioSemanal;
  label: string;
  short: string;
}> = [
  { code: "lun", label: "Lunes", short: "Lun" },
  { code: "mar", label: "Martes", short: "Mar" },
  { code: "mie", label: "Miércoles", short: "Mié" },
  { code: "jue", label: "Jueves", short: "Jue" },
  { code: "vie", label: "Viernes", short: "Vie" },
  { code: "sab", label: "Sábado", short: "Sáb" },
  { code: "dom", label: "Domingo", short: "Dom" },
];

/**
 * FormState shape for the horarioJson submission. `value` is the parsed
 * HorarioSemanal object (or null) — the same shape returned by
 * `updateGymField` after Zod narrows the JSON-stringified payload.
 */
type ScheduleFormState = FormState<{ field: GymField; value: unknown }>;

/**
 * Build an "all closed" week. Used when the admin first opens the form
 * with no existing schedule — sensible empty default that doesn't pretend
 * to know the gym's hours.
 */
function allClosedWeek(): HorarioSemanal {
  return {
    lun: { abierto: false, apertura: null, cierre: null },
    mar: { abierto: false, apertura: null, cierre: null },
    mie: { abierto: false, apertura: null, cierre: null },
    jue: { abierto: false, apertura: null, cierre: null },
    vie: { abierto: false, apertura: null, cierre: null },
    sab: { abierto: false, apertura: null, cierre: null },
    dom: { abierto: false, apertura: null, cierre: null },
  };
}

interface WeeklyScheduleEditorProps {
  initial: HorarioSemanal | null;
}

/**
 * Admin editor for the structured `horarioJson` field.
 *
 * 7 day cards in a responsive grid (1 col mobile / 2 col tablet+ / 3 col lg+).
 * Each card exposes an Abierto/Cerrado switch + two `<input type="time">`
 * pickers (Apertura + Cierre) that are hidden when the day is closed.
 *
 * Owns its `useActionState(updateGymField, …)` call, sends the full weekly
 * object as a JSON-stringified hidden input (matching the gymFieldSchema
 * horarioJson variant), and triggers a sonner success toast + router.refresh
 * on save — mirroring the pattern in `GymConfigManager` sub-forms.
 *
 * Bypasses the FieldConfig shell intentionally: a 7-day editor with 14 time
 * inputs + 7 switches is qualitatively different from the single-input
 * FieldConfig sub-forms. The WeeklyScheduleEditor renders as a peer card
 * in the manager, reusing only the AdminCard + icon + submit-button styling.
 *
 * Stable `data-testid` selectors (`day-card-${code}`, `toggle-${code}`,
 * `time-${code}-apertura`, `time-${code}-cierre`, `submit-schedule`) drive
 * the E2E per-day interaction test.
 */
export function WeeklyScheduleEditor({ initial }: WeeklyScheduleEditorProps) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<HorarioSemanal>(initial ?? allClosedWeek());

  const [state, formAction, isPending] = useActionState<ScheduleFormState, FormData>(
    updateGymField,
    { success: false, errors: undefined, message: undefined }
  );

  // The action returns the saved object in `state.data`; resync the form
  // state to the server-canonical payload on success so the toggles reflect
  // the persisted truth (matches the FieldSubForm resync pattern). The
  // setState is intentional: the server is the source of truth on save,
  // and Zod may have normalized the payload (e.g. coerced nullish times
  // to null). Same pattern as GymPriceEditor — see the disable comment.
  //
  // Only fire the toast + resync on the pending → done transition. The
  // previous pattern (chequear `state.success` en cada render) leaked
  // toasts across router.refresh / re-mount / cache revalidation.
  const wasPendingRef = useRef(false);
  useEffect(() => {
    if (wasPendingRef.current && !isPending) {
      if (state.success) {
        const saved = state.data?.value;
        if (saved && typeof saved === "object") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSchedule(saved as HorarioSemanal);
        }
        toast.success("Horarios actualizados");
        router.refresh();
      } else if (state.message) {
        toast.error(state.message);
      }
    }
    wasPendingRef.current = isPending;
    // Explicit deps: the effect reads `state.success`, `state.message`,
    // and `state.data?.value` — listing each field (instead of the full
    // state object) makes the intent clearer and avoids re-runs on
    // unrelated state-shape changes.
  }, [isPending, state.success, state.message, state.data?.value, router]);

  // Pre-serialize the schedule to JSON so the hidden input carries a string
  // (matching the gymFieldSchema horarioJson variant — which receives the
  // raw FormData value, parses JSON, then Zod-validates the inner object).
  const serializedValue = JSON.stringify(schedule);

  function setDay(code: keyof HorarioSemanal, patch: Partial<HorarioDia>) {
    setSchedule((prev) => ({
      ...prev,
      [code]: { ...prev[code], ...patch },
    }));
  }

  return (
    <AdminCard variant="standard">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Horarios</h3>
          <p className="text-sm text-muted-foreground">
            Activá cada día y configurá el horario de atención.
          </p>
        </div>
      </div>

      <form
        action={formAction}
        className="space-y-4"
        onSubmit={(e) => {
          // Time-range validation for each open day. Mirrors the pattern
          // in `feriado-manager.tsx` (horaInicio >= horaFin → toast.error).
          // The same `>=` comparison rejects equal times too, matching the
          // feriado behavior — the user can always reopen at exactly the
          // closing time by typing it directly into the inputs.
          for (const { code, label } of DAYS) {
            const day = schedule[code];
            if (
              day.abierto &&
              day.apertura &&
              day.cierre &&
              day.apertura >= day.cierre
            ) {
              e.preventDefault();
              toast.error(
                `${label}: la hora de apertura debe ser menor que la hora de cierre`
              );
              return;
            }
          }
        }}
      >
        <input type="hidden" name="field" value="horarioJson" />
        <input type="hidden" name="value" value={serializedValue} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map(({ code, label, short }) => {
            const day = schedule[code];
            return (
              <div
                key={code}
                data-testid={`day-card-${code}`}
                className="rounded-lg border border-border bg-background p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{short}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {day.abierto ? "Abierto" : "Cerrado"}
                    </span>
                    <Switch
                      checked={day.abierto}
                      data-testid={`toggle-${code}`}
                      onCheckedChange={(checked) =>
                        setDay(code, {
                          abierto: checked,
                          // When closing, clear the times so the persisted
                          // object matches the closed-day shape (abierto=false
                          // ⇒ times null). The form is the consistency guarantee;
                          // the Zod schema accepts the shape either way.
                          apertura: checked ? day.apertura ?? "09:00" : null,
                          cierre: checked ? day.cierre ?? "18:00" : null,
                        })
                      }
                      aria-label={`${label} abierto o cerrado`}
                      disabled={isPending}
                    />
                  </div>
                </div>

                {day.abierto && (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs text-muted-foreground">
                      <span className="block mb-1">Apertura</span>
                      <input
                        type="time"
                        data-testid={`time-${code}-apertura`}
                        value={day.apertura ?? ""}
                        onChange={(e) =>
                          setDay(code, { apertura: e.target.value || null })
                        }
                        disabled={isPending}
                        className="w-full px-2 py-1.5 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-ring disabled:opacity-50"
                      />
                    </label>
                    <label className="block text-xs text-muted-foreground">
                      <span className="block mb-1">Cierre</span>
                      <input
                        type="time"
                        data-testid={`time-${code}-cierre`}
                        value={day.cierre ?? ""}
                        onChange={(e) =>
                          setDay(code, { cierre: e.target.value || null })
                        }
                        disabled={isPending}
                        className="w-full px-2 py-1.5 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-ring disabled:opacity-50"
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* General form-level error (Zod failures on the horarioJson
            variant surface in `state.message`, not on a specific field) */}
        {state.message && !state.success && !isPending && (
          <p className="text-destructive text-sm" role="alert">
            {state.message}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            data-testid="submit-schedule"
            disabled={isPending}
            className="px-4 py-2 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors flex items-center gap-2"
          >
            {isPending ? (
              <>
                <DumbbellSpinner size={16} />
                Guardando...
              </>
            ) : (
              "Guardar horarios"
            )}
          </button>
        </div>
      </form>
    </AdminCard>
  );
}
