import { Clock } from "lucide-react";
import type { HorarioSemanal } from "@/lib/schemas";
import { formatHorario } from "@/components/informacion/format-horario";

interface HoursSectionProps {
  /**
   * Gym weekly schedule as configured by the admin. `null` means the
   * admin has not set this field yet — in that case the section
   * renders nothing (no fake placeholder) to avoid leaking a hardcoded
   * default like "8:00 a 22:00" / "Lunes a viernes".
   *
   * The `formatHorario` formatter ALSO returns `null` when all 7 days
   * are closed (e.g. an admin saved an "all closed" week). In that
   * case the section hides itself as well, mirroring the unconfigured
   * state — the public page never renders a confusing "Dom cerrado" line
   * with no open days.
   */
  horario: HorarioSemanal | null;
}

/**
 * Public `/informacion` hours section.
 *
 * Pure rendering: takes a structured `HorarioSemanal` and delegates to
 * `formatHorario` for the display string. The component itself is a
 * thin shell (icon + heading + the formatted line) — all business
 * logic lives in `formatHorario` so it can be unit-tested in isolation.
 *
 * App-controlled rendering: admin free-text NEVER reaches this
 * component. The shape is Zod-validated at the read boundary
 * (`getGymDisplayForServer`) and the formatter generates the display
 * string from the structure. The admin cannot inject arbitrary text.
 */
export function HoursSection({ horario }: HoursSectionProps) {
  if (!horario) return null;

  const formatted = formatHorario(horario);
  if (!formatted) return null;

  return (
    <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
        Horarios
      </h2>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-[var(--foreground)]" />
        <p className="text-lg text-[var(--foreground)] whitespace-pre-line">{formatted}</p>
      </div>
    </section>
  );
}
