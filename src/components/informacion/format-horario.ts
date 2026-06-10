import type { HorarioSemanal } from "@/lib/schemas";

/**
 * Stable ordering and labels for the 7 days of the week.
 * The `key` MUST match the keys of `HorarioSemanal` exactly; the
 * `short` label is used as the group label (e.g. "Lun a Vie …").
 */
const DAYS: ReadonlyArray<{
  key: keyof HorarioSemanal;
  short: string;
}> = [
  { key: "lun", short: "Lun" },
  { key: "mar", short: "Mar" },
  { key: "mie", short: "Mié" },
  { key: "jue", short: "Jue" },
  { key: "vie", short: "Vie" },
  { key: "sab", short: "Sáb" },
  { key: "dom", short: "Dom" },
];

/**
 * Internal shape for a single grouped span of consecutive days with
 * the same status (open with identical hours, or all closed).
 */
type Group =
  | { kind: "open"; first: number; last: number; apertura: string; cierre: string }
  | { kind: "closed"; first: number; last: number };

/**
 * Pure formatter that turns a structured `HorarioSemanal` object into
 * the single-line string the public `/informacion` page renders.
 *
 * Algorithm:
 *   1. Walk DAYS in order and classify each day as either "open with
 *      the same (apertura, cierre) hours as the previous open day" or
 *      "closed" (or "open with different hours" — which starts a new
 *      group).
 *   2. Group consecutive same-classification days.
 *   3. Format each group:
 *        - Open group of 1:  "Mié 8:00 a 22:00"
 *        - Open group of N:  "Lun a Vie 8:00 a 22:00"
 *        - Closed group of 1: "Dom cerrado"
 *        - Closed group of N: "Sáb y Dom cerrado"
 *   4. Join groups with " · " (middle dot with surrounding spaces).
 *   5. If all 7 days are closed → return `null` (the section hides itself).
 *
 * v1 limitation: cross-midnight schedules (`apertura > cierre`, e.g.
 * 22:00 → 02:00) are NOT handled. The data level allows them, but this
 * formatter will render the literal times as if the closure happens
 * the same day. Documented in the proposal as a known gap; v2 can
 * add a `cierreSiguienteDia: boolean` flag.
 *
 * v1 limitation: `apertura === cierre` (zero-length day) renders as
 * "8:00 a 8:00" — accepted at the data level (form does not validate),
 * displayed verbatim. Callers can filter at the form level if they care.
 */
export function formatHorario(horario: HorarioSemanal): string | null {
  // Build the raw groups by walking the 7 days in order.
  const groups: Group[] = [];
  for (let i = 0; i < DAYS.length; i++) {
    const day = horario[DAYS[i].key];
    if (!day.abierto || day.apertura == null || day.cierre == null) {
      // Closed day — start (or extend) a closed group.
      const last = groups[groups.length - 1];
      if (last && last.kind === "closed" && last.last === i - 1) {
        last.last = i;
      } else {
        groups.push({ kind: "closed", first: i, last: i });
      }
      continue;
    }
    // Open day — group with previous only if previous is open AND has
    // the exact same (apertura, cierre) pair. Different hours start a
    // new group even when consecutive (e.g. "Lun 8-12 · Mar 14-20").
    const last = groups[groups.length - 1];
    if (
      last &&
      last.kind === "open" &&
      last.last === i - 1 &&
      last.apertura === day.apertura &&
      last.cierre === day.cierre
    ) {
      last.last = i;
    } else {
      groups.push({
        kind: "open",
        first: i,
        last: i,
        apertura: day.apertura,
        cierre: day.cierre,
      });
    }
  }

  // If the only group is "all 7 closed", return null so the section
  // hides itself. This matches the "no fake placeholder" UX rule
  // (the public page never renders a hardcoded default).
  if (groups.length === 1 && groups[0].kind === "closed" && groups[0].first === 0 && groups[0].last === 6) {
    return null;
  }

  // Format each group into its display fragment.
  const fragments = groups.map((g): string => {
    if (g.kind === "closed") {
      if (g.first === g.last) {
        return `${DAYS[g.first].short} cerrado`;
      }
      // 2 consecutive closed days → "Sáb y Dom cerrado" (explicit pair).
      // 3+ consecutive closed days → "Jue a Dom cerrado" (range).
      // Mirrors the open-day range behavior (2+ open days always use "a").
      if (g.last - g.first === 1) {
        return `${DAYS[g.first].short} y ${DAYS[g.last].short} cerrado`;
      }
      return `${DAYS[g.first].short} a ${DAYS[g.last].short} cerrado`;
    }
    // Open group — strip the leading zero from the hour for the
    // human-readable format ("8:00" instead of "08:00"). The HH:MM
    // 24h format with a leading zero is enforced at the data level
    // (Zod regex), but Spanish-language time rendering drops the
    // zero on single-digit hours ("a las 8", not "a las 08").
    const aperturaDisplay = stripLeadingZero(g.apertura);
    const cierreDisplay = stripLeadingZero(g.cierre);
    if (g.first === g.last) {
      return `${DAYS[g.first].short} ${aperturaDisplay} a ${cierreDisplay}`;
    }
    return `${DAYS[g.first].short} a ${DAYS[g.last].short} ${aperturaDisplay} a ${cierreDisplay}`;
  });

  return fragments.join(" · ");
}

/**
 * Drop a leading "0" from the hour portion of an "HH:MM" string.
 * "08:00" → "8:00", "22:00" → "22:00", "00:30" → "0:30".
 * The HH:MM data contract is preserved (the form still validates
 * "08:00"); only the display layer normalizes.
 */
function stripLeadingZero(hhmm: string): string {
  if (hhmm.startsWith("0") && hhmm.length >= 2 && hhmm[1] !== ":") {
    return hhmm.slice(1);
  }
  return hhmm;
}
