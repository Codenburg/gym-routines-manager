import { Clock } from "lucide-react"

interface HoursSectionProps {
  /**
   * Gym hours as configured by the admin. `null` means the admin has
   * not set this field yet — in that case the section renders nothing
   * (no fake placeholder) to avoid leaking a hardcoded default like
   * "8:00 a 22:00" / "Lunes a viernes".
   */
  horario: string | null
}

export function HoursSection({ horario }: HoursSectionProps) {
  if (!horario) return null

  return (
    <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
        Horarios
      </h2>
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-[var(--foreground)]" />
        <p className="text-lg text-[var(--foreground)] whitespace-pre-line">{horario}</p>
      </div>
    </section>
  )
}