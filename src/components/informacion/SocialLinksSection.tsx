import { Instagram, MessageCircle } from "lucide-react"

interface SocialLinksSectionProps {
  /**
   * Full Instagram URL (e.g. `https://www.instagram.com/<handle>/`).
   * `null` means not set — the Instagram button is hidden in that case.
   */
  socialInstagram: string | null
  /**
   * Full WhatsApp URL (e.g. `https://wa.me/<number>`).
   * `null` means not set — the WhatsApp button is hidden in that case.
   */
  socialWhatsapp: string | null
}

/**
 * Renders one button per non-null social URL. If both are null the
 * section renders nothing (no fake buttons with empty hrefs).
 */
export function SocialLinksSection({
  socialInstagram,
  socialWhatsapp,
}: SocialLinksSectionProps) {
  const hasInstagram = Boolean(socialInstagram)
  const hasWhatsapp = Boolean(socialWhatsapp)

  if (!hasInstagram && !hasWhatsapp) return null

  return (
    <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
        Redes Sociales
      </h2>
      <div className="flex gap-3">
        {hasInstagram && (
          <a
            href={socialInstagram!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium gap-1.5 px-2.5 h-8 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Instagram className="w-4 h-4" />
            Instagram
          </a>
        )}
        {hasWhatsapp && (
          <a
            href={socialWhatsapp!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium gap-1.5 px-2.5 h-8 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        )}
      </div>
    </section>
  )
}