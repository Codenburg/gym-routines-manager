interface AddressSectionProps {
  /**
   * Street address as configured by the admin. `null` means not set.
   */
  direccion: string | null
  /**
   * Google Maps embed URL (the full `https://www.google.com/maps/embed?…`
   * URL, ready to be used as an `<iframe src>`). `null` means not set.
   */
  mapsEmbedUrl: string | null
}

/**
 * Renders the address + Google Maps iframe.
 *
 * The section is rendered only when BOTH `direccion` and `mapsEmbedUrl`
 * are set. Showing one without the other would be incomplete (a text
 * address with no map, or a map with no address label) and is therefore
 * treated as "not configured yet" → render nothing.
 */
export function AddressSection({ direccion, mapsEmbedUrl }: AddressSectionProps) {
  if (!direccion || !mapsEmbedUrl) return null

  return (
    <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
        Dirección
      </h2>
      <p className="text-lg text-[var(--foreground)]">
        {direccion}
      </p>
      <div className="mt-4 w-full overflow-hidden rounded-lg border border-[var(--card-border)]">
        <iframe
          src={mapsEmbedUrl}
          width="100%"
          height="200"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ubicación del gimnasio"
          className="aspect-video w-full"
        />
      </div>
    </section>
  )
}