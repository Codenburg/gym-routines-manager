/**
 * Canonical identifier for the single gym tenant.
 *
 * The product is a single-gym deployment: every Prisma row that
 * carries a `gymId` column uses the same string. Hard-coding `"gym"`
 * across action files caused GGA v2.8.1 to flag the duplication and
 * made it trivial to introduce a typo. Centralising the value here
 * keeps the literal to a single source of truth and lets the
 * `.gga-ignore` file reference `GYM_SINGLETON_ID` symbolically in
 * future cleanups.
 */
export const GYM_SINGLETON_ID = "gym" as const
