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
 * Renders the address text + Google Maps iframe, independently.
 *
 * Pre-change: section rendered only when BOTH fields were set
 * (`!direccion || !mapsEmbedUrl` → return null). That was incomplete:
 * if the admin cleared `direccion` via the new Vaciar button (T-010)
 * while leaving `mapsEmbedUrl`, the iframe would disappear too,
 * even though the map data was still valid.
 *
 * Post-change (REQ-5):
 *   - `direccion` set: show the `<p>` with the address text.
 *   - `mapsEmbedUrl` set: show the `<iframe>`.
 *   - Both set: show both.
 *   - Both null: render nothing (section "not configured yet").
 *
 * The 4 combinations are REQ-5.1 (only iframe — after clearing
 * `direccion`), REQ-5.2 (only text — after clearing `mapsEmbedUrl`),
 * REQ-5.3 (both null → hidden), and the default (both set).
 */
export function AddressSection({ direccion, mapsEmbedUrl }: AddressSectionProps) {
  // Decoupled null-check: hide ONLY when both are null (REQ-5.3).
  // Single-field presence (e.g. iframe without address text per REQ-5.1)
  // is a valid display state and renders that single element.
  if (!direccion && !mapsEmbedUrl) return null

  return (
    <section className="bg-[var(--button-secondary-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
        Dirección
      </h2>
      {direccion && (
        <p className="text-lg text-[var(--foreground)]">{direccion}</p>
      )}
      {mapsEmbedUrl && (
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
      )}
    </section>
  )
}