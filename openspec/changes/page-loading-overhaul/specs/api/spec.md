# Delta for API

## ADDED Requirements

### Requirement: Promociones Mutation Cache Invalidation

All mutation server actions in `src/app/actions/promociones.ts` (create, update content, update price, toggle active, delete) MUST call `revalidateTag("promociones")` alongside their existing `revalidatePath` calls. The `promociones` cache tag MUST invalidate all cached readers that subscribe to it (e.g. `getPromocionesActivasPublic`, `getPromocionesForAdmin` in `src/lib/promociones.ts`). Without the `revalidateTag` call, cached readers would serve stale data for up to their TTL after a mutation.

#### Scenario: Create promocion invalidates cache

- GIVEN an admin creates a new promocion via the `createPromocion` action
- WHEN the action completes successfully
- THEN the action MUST call `revalidatePath` for affected public/admin paths
- AND MUST call `revalidateTag("promociones")`
- AND the next read of any `promociones`-tagged reader MUST return the new promocion

#### Scenario: Update promocion invalidates cache

- GIVEN an admin updates an existing promocion (content, price, or active state) via the corresponding update action
- WHEN the action completes successfully
- THEN the action MUST call `revalidateTag("promociones")`
- AND the next read MUST reflect the update

#### Scenario: Delete promocion invalidates cache

- GIVEN an admin deletes a promocion via the `deletePromocion` action
- WHEN the action completes successfully
- THEN the action MUST call `revalidateTag("promociones")`
- AND the deleted promocion MUST NOT appear in subsequent reads of the cached list

#### Scenario: Cache tag is documented

- GIVEN the `promociones` cache tag exists
- WHEN a developer inspects the readers and actions
- THEN the tag name MUST be a single string literal `"promociones"` (kebab-case, entity singular) used identically in both the reader's `tags` array and the action's `revalidateTag` call
- AND the same tag MUST be used by both public and admin readers (so one invalidation clears both)

### Requirement: Descuentos por Duracion Mutation Cache Invalidation

All mutation server actions in `src/app/actions/descuentos-duracion.ts` (create, update, delete) MUST call `revalidateTag("descuentos-duracion")` alongside their existing `revalidatePath` calls. The `descuentos-duracion` cache tag MUST invalidate all cached readers that subscribe to it (e.g. `getDescuentosDuracionPublic`, `getDescuentosDuracionForAdmin` in `src/lib/descuentos-duracion.ts`).

#### Scenario: Create descuento-duracion invalidates cache

- GIVEN an admin creates a new descuento-duracion via the `createDescuentoDuracion` action
- WHEN the action completes successfully
- THEN the action MUST call `revalidatePath` for affected paths
- AND MUST call `revalidateTag("descuentos-duracion")`
- AND the next read of any `descuentos-duracion`-tagged reader MUST return the new discount

#### Scenario: Update descuento-duracion invalidates cache

- GIVEN an admin updates an existing descuento-duracion via the `updateDescuentoDuracion` action
- WHEN the action completes successfully
- THEN the action MUST call `revalidateTag("descuentos-duracion")`
- AND the next read MUST reflect the update

#### Scenario: Delete descuento-duracion invalidates cache

- GIVEN an admin deletes a descuento-duracion via the `deleteDescuentoDuracion` action
- WHEN the action completes successfully
- THEN the action MUST call `revalidateTag("descuentos-duracion")`
- AND the deleted discount MUST NOT appear in subsequent reads of the cached list

### Requirement: Feriados Mutation Cache Invalidation

All mutation server actions in `src/app/actions/feriados.ts` (create, update, delete) MUST call `revalidateTag("feriados")` alongside their existing `revalidatePath` calls. The `feriados` cache tag MUST invalidate all cached readers that subscribe to it (e.g. `getFeriadosActivosPublic`, `getFeriadosForAdmin`, `getLatestFeriadoDatePublic` in `src/lib/feriados.ts`). The `getLatestFeriadoDatePublic` reader has a 30-second TTL (not 60s) so the "new" badge freshness on the home notification stays accurate — the `revalidateTag` call MUST also invalidate this reader.

#### Scenario: Create feriado invalidates cache

- GIVEN an admin creates a new feriado via the `createFeriado` action
- WHEN the action completes successfully
- THEN the action MUST call `revalidatePath` for affected paths
- AND MUST call `revalidateTag("feriados")`
- AND the next read of any `feriados`-tagged reader (public or admin) MUST return the new feriado

#### Scenario: Update feriado invalidates cache

- GIVEN an admin updates an existing feriado via the `updateFeriado` action
- WHEN the action completes successfully
- THEN the action MUST call `revalidateTag("feriados")`
- AND the next read MUST reflect the update

#### Scenario: Delete feriado invalidates cache

- GIVEN an admin deletes a feriado via the `deleteFeriado` action
- WHEN the action completes successfully
- THEN the action MUST call `revalidateTag("feriados")`
- AND the deleted feriado MUST NOT appear in subsequent reads of the cached list

#### Scenario: Latest-feriado-date freshness is preserved

- GIVEN `getLatestFeriadoDatePublic` is cached with a 30-second TTL (shorter than 60s for "new" badge freshness)
- WHEN an admin creates or updates a feriado
- THEN `revalidateTag("feriados")` MUST also invalidate the `getLatestFeriadoDatePublic` cache
- AND the home page notification badge MUST reflect the new "latest" feriado within 30 seconds of the mutation
