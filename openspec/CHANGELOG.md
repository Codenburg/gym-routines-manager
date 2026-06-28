# Changelog

Todos los cambios significativos del proyecto se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [1.1.0] - 2026-06-24

### Added
- **Botón "Vaciar" por sub-form para los 4 campos opcionales del gimnasio** — `src/components/admin/GymConfigManager.tsx` agrega un botón Trash2 (`title="Vaciar campo"`, `text-muted-foreground hover:text-destructive hover:bg-destructive/10`) al lado de "Guardar X" en los 4 sub-forms opcionales: `direccion`, `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp`. `IDENTITY_CONFIG` (nombre) sigue sin botón — R2 mitigation via literal-union `clearable?: false | true` + structural test en `tests/unit/field-config-clearable.test.ts`. Per-field testids: `clear-direccion`, `clear-mapa`, `clear-instagram`, `clear-whatsapp`. Botón es `type="button"` + `onClick` + `useTransition` (vive dentro del mismo `<form>` para layout pero NO lo submitea — D1).
- **Nueva server action `clearGymDisplayField` en `src/app/actions/gym.ts`** — escribe `null` directo via `prisma.gym.update({ where: { id: 'gym' }, data: { [field]: null } })`, ADMIN-only via el patrón `verifyAdmin(headers)` que ya usa `updateGymField` (líneas 245-247). Bypassea `gymFieldSchema` (que rechaza empty/null con `min(1)` / `url()`) — el botón Vaciar explícitamente QUIERE escribir null, ese es el punto. On success: `revalidateTag('gym-config', 'max')` + `revalidatePath('/')` + `revalidatePath('/informacion')` + `revalidatePath('/admin/config')`. Devuelve `{ success, message }` para que el cliente pueda detectar failure sin throw.
- **Toast undoable con barra de progreso 5s** — `src/lib/toast.ts` exporta `showUndoableToast({ message, onUndo, durationMs, onAutoDismiss })` que renderiza un toast sonner con botón "Deshacer" + un `<div className="undo-progress-bar" data-testid="undo-toast-progress">` en el slot `description`. La animación usa el keyframe `undoBar` (definido en `src/app/globals.css`) que consume la CSS variable `--undo-duration` para soportar duraciones custom. La distinción undo/auto-dismiss usa un flag `wasUndone` closure-scoped + los callbacks `onAutoClose` (timer expiry) y `onDismiss` (manual close / programmatic) de sonner 2.0.7.
- **Wrappers centralizados de toast en `src/lib/toast.ts`** — reemplaza los 67 call sites directos a `sonner` en 14 archivos admin + 1 auth con `showSuccess` / `showError` / `showInfo` del nuevo módulo (T-006 + T-007). El `<Toaster>` en `src/app/layout.tsx:96` ahora pasa `toastOptions={{ unstyled: true }}` para que los wrappers tengan control total del styling via Tailwind tokens (`bg-success`, `bg-destructive`, etc., definidos en `src/app/globals.css` como CSS vars). Migración mecánica: import swap + 1:1 rename `toast.success(...)` → `showSuccess(...)`.
- **`/admin/config` ahora es ADMIN-only** — `src/app/(admin)/admin/config/page.tsx:30` cambia el redirect target de `/admin/rutinas` (legado del patrón de trainers) a `/` (REQ-4.1). TRAINER user que navega a `/admin/config` ahora aterriza en la home pública. Los otros admin pages (`/admin/rutinas`, `/admin/trainers`, etc.) siguen siendo ADMIN+TRAINER via el layout parent.
- **`AddressSection` renderiza texto y mapa independientemente** — `src/components/informacion/AddressSection.tsx` cambia el null-check de `!direccion || !mapsEmbedUrl` (que ocultaba TODO si cualquiera era null) a `!direccion && !mapsEmbedUrl` (que solo oculta si AMBOS son null). Ahora se puede tener iframe sin dirección (REQ-5.1), dirección sin iframe (REQ-5.2), o ambos (default). Esto es prerequisito para que el botón Vaciar de `direccion` no rompa la visualización pública del mapa.

### Changed
- **Pending-state UI unificado** — `src/components/admin/GymConfigManager.tsx` introduce `const isBusy = isPending || isClearPending` (D9) para que input + Guardar + Vaciar se deshabiliten juntos durante cualquier acción en vuelo. El input ahora se deshabilita con `isBusy` (antes solo con `isPending`). Esto da feedback visual consistente al admin que ambos botones están ocupados.
- **`FieldConfig` extendido con `clearable?: false | true`** — literal-union (D7) en lugar de `boolean` para forzar opt-in explícito. El default es `false`; los 4 configs opcionales setean `true`. El structural test `tests/unit/field-config-clearable.test.ts` documenta el whitelist de 4 y blacklist de 2 (`nombre` + `horarioJson`) para que futuros devs tengan una guía clara al agregar campos.

### Notes
- This is a **MINOR** bump per semver (new user-facing feature: clear→null + undo). Criterio 🔴 + 🟢 ≥ 1 NOT met (no `fix:` commits in this change), pero `feat:` commits siempre justifican MINOR.
- No `BREAKING CHANGE:` — el comportamiento de Guardar (save flow) es backward-compatible: el form sigue funcionando exactamente igual para usuarios que nunca tocan el botón Vaciar.
- Full SDD cycle: explore → propose → spec → design → tasks → apply (artifacts in Engram, branch `feat: clear-gym-fields`, single PR, 800-line budget per user preflight D2).
- DevNote: la implementación de sonner 2.0.7 separa los dismissal callbacks (`onAutoClose` vs `onDismiss`) — distinto a lo que asumía el design original (D13). El wrapper cubre ambos paths con un flag `wasUndone` para evitar doble-fire.

### Fixed (post-apply polish)
- **`router.refresh()` ANTES de `showSuccess()`** (`src/components/admin/GymConfigManager.tsx`) — Next.js 16 re-fetchea el RSC payload en `router.refresh()`, lo cual reconcilia el árbol React y mata cualquier toast agregado al store de sonner entre la llamada y el commit. Llamar `refresh()` PRIMERO deja que la reconciliación complete, después el toast se agrega al árbol estable. Sin este orden, los toasts no se renderizaban visualmente. `ee75555`.
- **`id` único por campo para el undo toast** (`id: "gym-undo-${config.field}"`) — sonner 2.0.7 no puede reemplazar un `toast.custom()` con un `toast.success()` que compartan el mismo `id`. Usar IDs distintos (`gym-config` para save, `gym-undo-<field>` para undo) evita el conflicto y permite que ambos coexistan. `05a8d43`.
- **`dismiss()` antes de `showUndoableToast()`** — el `sonnerToast.dismiss()` previo al `showUndoableToast` limpia cualquier save toast residual, y el `setTimeout(250ms)` espera a que la animación de salida termine antes de montar el undo toast (sin esto, ambos coexisten brevemente durante el dismiss). `a7f73c2`.
- **Pause/resume del progress bar en sync con sonner** — el `useEffect` previo dependía de `isHovered`, lo cual re-montaba el RAF en cada hover y reseteaba el progreso. Fix: refs (`accumulatedMsRef` + `resumeStartRef`) que sobreviven al hover sin reset. `dff9616`. Validado manualmente (Playwright `page.mouse.move` no dispara `onMouseEnter` consistentemente en portales de sonner — futuro test E2E debería usar `dispatchEvent`).
- **Toast de error de servidor SOLO cuando no hay error de validación de Zod** — el `useEffect` del `formStateEffect` cambiaba `else if (state.message)` a `else if (state.message && !state.errors)`, evitando el toast duplicado "Error de validación" (que ya se muestra inline). El `generalError` inline ahora también requiere `state.errors` truthy. `31799e4`.
- **Mensajes de error del Zod schema con tono cálido Rioplatense + ícono `AlertCircle`** — los 5 mensajes `min(1)` ahora dicen "Ey, falta el nombre/dirección/etc. del gimnasio", los 3 `url()` dicen "Ey, el link de Maps/Instagram/WhatsApp no es válido — tiene que empezar con https://". El `AdminFormField` ahora muestra el error con ícono `AlertCircle` (`w-3.5 h-3.5 shrink-0`), consistente con `PriceSection.tsx` y `feriado-manager.tsx`. El `fieldError` se lee via `Object.values(state.errors).flat()[0]` (Zod agrupa por path del schema, no por `field`). `40ae1e4`.
- **Botón "Deshacer" verticalmente centrado** — `top-2 right-2` (esquinasuperior) → `top-1/2 right-3 -translate-y-1/2` (centrado vertical con el texto), patrón estándar de sonner. `4d502b6`.
- **`PrismaClient` initialization en `gym-reset.ts`** — `new PrismaClient()` sin opciones tira silenciosamente en Prisma 7. Fix: usar el adapter pattern (mirror de `descuentos-reset.ts`). `42a738f`.
- **Defer revalidation from `clearGymDisplayField`** — `revalidatePath` en Next.js 16 auto-refreshea la ruta actual (~200ms), contradiciendo el "delayed refresh" del undo. Fix: solo `revalidateTag('gym-config', 'max')` (no re-fetchea). `19f768d`.
- **Decouple `AddressSection` null-check** — `!direccion || !mapsEmbedUrl` → `!direccion && !mapsEmbedUrl`. Ahora se puede tener iframe sin dirección (REQ-5.1), dirección sin iframe (REQ-5.2), o ambos. `2b72f21`.
- **Split-state bug + sonner 2.0.7 `onDismiss` quirk** — el `useEffect` de `formStateEffect` se ejecutaba 2 veces en React 19 Strict Mode; la segunda ejecución disparaba un save toast extra. `wasPendingRef` ahora se actualiza al final del effect para que la guard `wasPendingRef.current && !isPending` filtre correctamente. El `showUndoableToast` maneja `onAutoClose` (timer expiry) y `onDismiss` (manual close) separadamente con un flag `wasUndone`. `829cfbe`.
- **Toast styling polish** — el primer intento de reescribir los wrappers de toast tuvo `unstyled: true` en el `<Toaster>` + clases custom, lo cual producía toasts cuadrados sin padding/border-radius/width. Fix: usar `unstyled: true` solo en el Toaster + los wrappers pasan `unstyled: true` per-call + clases correctas (`flex items-start gap-3 p-4 w-[356px] rounded-lg shadow-lg`). El progress bar pasó de `::before` CSS keyframe a un componente `ToastWithProgress` JS-driven (CSS approaches fallaban por `unstyled: true` + layer order + sonner 2.0.7 DOM). `2a2dfe1` + `7d217d6`.
- **Redirect `/admin/config` target** — `/admin/rutinas` (legado del patrón de trainers) → `/` (REQ-4.1). `de23499`.



---

## [1.0.3] - 2026-06-22

### Fixed
- **Trainers no podían acceder al panel admin** — `src/proxy.ts` solo dejaba pasar rol `ADMIN` a `/admin/*`, contradiciendo el `isAdminOrTrainer` check del layout y el design intent (trainers gestionan rutinas desde el panel). El proxy corría antes del layout y redirigía a `/`. Se aflojó el chequeo a `ADMIN` o `TRAINER`. `59c3f92`.

### Notes
- This is a **PATCH** bump per semver (1 `fix:` commit, 🔴 hotfix — funcionalidad core caída para el rol trainer). Criterio 🔴 ≥ 1 MET.

---

## [1.0.2] - 2026-06-21

### Fixed
- **Excluded 1 mes from `MESES_OPTIONS`** — `src/components/admin/descuento-duracion-manager.tsx:35-46` removed the `{ value: 1, label: "1 mes" }` entry from the dropdown. The remaining 11 options cover 2-12 months.
- **Tightened `mesesEnum` Zod schema** — `src/lib/schemas.ts:313` changed from `z.number().int().min(1).max(12)` to `z.number().int().min(2).max(12)`. Server-side defense-in-depth: a direct POST with `meses=1` would now be rejected with a 400, not just hidden in the UI. A 1-month "discount" is semantically contradictory — the whole point of a *descuento por duración* is to incentivize commitment to multiple months upfront. 1 month is just the first installment, not a duration-based discount.

### Data
- **Deleted orphaned descuento row** (id=53, `meses=1`, `porcentaje=1`, created 2026-06-21 00:51 during manual testing of v1.0.1) — the new product rule invalidates the row's semantic meaning. Pre-production data, no preservation needed.

### Notes
- This is a **PATCH** bump per semver (1 `fix:` commit, validation tightening). The 🟡 patch-bump criterion (2 media fixes) is now MET — counted: `412e3a7` (Precio final formula fix, v1.0.1) + `35603fd` (this fix). The 🔴 hotfix criterion was already met by v1.0.1.

---

## [1.0.1] - 2026-06-21

### Fixed
- **Zod schema `mesesEnum` rejected any value other than `{3, 6, 9, 12}` in `DescuentoDuracion` validation** — `src/lib/schemas.ts:312` had `z.union([z.literal(3), z.literal(6), z.literal(9), z.literal(12)])` while the admin form's `<select>` (`src/components/admin/descuento-duracion-manager.tsx:35-48`) already listed all 12 months in `MESES_OPTIONS`. The form would submit, the server action would parse `meses` to a number, and the Zod validation would reject it with a generic "invalid input" toast — breaking the feature for meses ∈ {1, 2, 4, 5, 7, 8, 10, 11}. Replaced the union with `z.number().int().min(1).max(12)`. `73a2932`.
- **"Precio final" displayed the monthly price instead of the total upfront cost** in both admin (`src/components/admin/descuento-duracion-manager.tsx:386-390`) and public (`src/components/informacion/DurationDiscountsSection.tsx:81-83`) views. Per product intent ("el descuento por duración es pagar todos los meses de una"), the formula is now `base × (1 - pct/100) × meses` (total upfront), not `base × (1 - pct/100)` (monthly). Example: base $50.000, 15% off, 3 meses now shows `$ 127.500` (was `$ 42.500`). The E2E test `S2.D.4` was updated to compute the expected value dynamically via `formatPriceARS(50000 * 0.85 * fixture.meses)` instead of hardcoded "42.500". `412e3a7`.

### Notes
- This is a **PATCH** bump per semver (2 `fix:` commits, no new features). The 🔴 patch-bump criterion (1 hotfix = funcionalidad core caída) is met by the Zod schema fix.
- The user-facing v1.0.0 release added the descuento-precio-final feature with the monthly formula; v1.0.1 corrects both the formula and the Zod validation.
- Full SDD cycle: explore → propose → spec → design → tasks → apply → verify → archive (artifacts in Engram, branch `fix/bugs-precio-final-y-zod-meses`).

---

## [1.0.0] - 2026-06-15

The first stable release of the project, now rebranded as **gymflow** (formerly `gym-routines-manager`).

### Added
- **Project rename to gymflow** (`3541791`, `b6bced4`) — package.json, imports, README, AGPL-3.0 license. Better branding; the product is no longer tied to "rutinas" only.
- **E2E test coverage for critical flows** (PRs 1-4, 2026-06-13 to 2026-06-15): `rutinas.spec.ts`, `feriados-crud.spec.ts`, `promociones-descuentos.spec.ts`, `trainers.spec.ts`, `auth.spec.ts` + page objects. 245 Playwright tests total.
- **E2E test infrastructure** (`afefa3a`): `retries: 1` in Playwright config, `pnpm test:fast` with `concurrently` + `wait-on`, `@slow` tag for filtering, page-object skeletons, `tests/helpers.ts` extraction.

### Changed
- **Project name** in package.json: `gym-routines-manager` → `gymflow`.
- **License**: AGPL-3.0 added.
- **README visual overhaul** with hero, badges, TOC, grouped sections (`b6bced4`).
- **`(revalidateTag as any)` casts project-wide replaced** with the proper Next 16 two-arg signature `revalidateTag("tag", "max")` (`b38d3c1`) — GGA-FOLLOWUP-2 fully resolved.
- **Admin layout**: `render children once, control visibility via CSS` (`a1b1990`) — fixes pre-existing AdminLayout strict mode bug that masked other test failures.
- **Prisma 7 adapter fix for tests** (`e38d13e`) — `descuentos-reset.ts` and `gym-reset.ts` migrated to `PrismaPg` + `new pg.Pool` pattern (matches production setup).
- **Legacy `/admin/rutinas/[id]/dias` flow removed** (`cd2d42c`) — page, API route, 5 orphan components, 2 dead spec files. ~1005 lines + 2 dirs emptied. The 3 `revalidatePath` calls in `actions/ejercicios.ts` that pointed to the old URL now point to `/admin/rutinas/${id}`.
- **Admin panel responsive mobile polish** (`504210b`): reveal hover buttons on touch, stack feriado/descuento forms, PageHeader truncate, submit bar stack.

### Fixed
- **S2.P.2 edit promocion** — added `submitEdit()` helper + `data-testid="promocion-submit-edit-button"` (`c9259b1`). Production form fix (race condition between `useEffect` and submit) is documented as out-of-scope for this cycle and tracked separately.
- **S2.P.3 delete promocion** — `clickConfirmDelete()` helper + AlertDialog handling (`952b138`).
- **S2.D.3 delete descuento** — same `clickConfirmDelete()` helper (`1b66447`).
- **E2E test 5.2.3 isolation** — `test.describe.configure({ mode: 'serial' })` + file-level `test.afterEach(resetGymConfig)` with `tests/utils/gym-reset.ts` (`624561c`).
- **GGA pre-commit hook** — diff-only review with `.gga-ignore` escape hatch + `GGA_DIFF_FILTER=off` kill switch (`71a628e`, `2646999`, `36462f6`, `ad49f52`, `2d89462`, `0d26b0d`).
- **Hardcoded `gymId: "gym"`** → `GYM_SINGLETON_ID` constant (`1f60526`, `92da32c`) — applied in `actions/promociones.ts` and `actions/descuentos-duracion.ts`.
- **`prisma.feriado.findFirst` duplicate-pre-check** wrapped in try/catch (`c931f86`).
- **`formData.get("id") as string` cast hides null** — null-guard added in `actions/feriados.ts` (`f9bdd8f`).
- **`revalidatePath("/admin/descuentos")` mismatch** — corrected to `/admin/descuentos-duracion` in `actions/descuentos-duracion.ts:94,138,167` (`1ed73ef`).
- **GGA-FOLLOWUP-1** (`Promise.all` sin try/catch en `src/app/(admin)/admin/page.tsx`) — wrap con try/catch + ErrorState fallback (`8300e2d` tech debt cleanup batch).
- **GGA-FOLLOWUP-3** (Prisma Decimal serialization) — `getGymConfigForServer` replaced by `getGymNameForServer(): Promise<string | null>` (`5f05a8e`).
- **GGA-FOLLOWUP-7** (Prisma migration workflow documentation) — documented in `CONTRIBUTING.md` §"Workflow de migraciones (no estándar)" (`3cd9ad5`).
- **GGA-FOLLOWUP-13** (Return-type inconsistency in `actions/feriados.ts`) — unified to `Promise<FormState<{ id: string }>>` (`8300e2d`).

### Notes
- This is a **MAJOR** version bump per semver (0.x → 1.0.0 = first stable). The 1.0.0 release marks the project's transition from "development" to "stable for first client onboarding".
- 2 post-merge bugs were found during manual testing of the v1.0.0 release (Bug 1: Precio final formula; Bug 2: Zod schema meses). Fixed in v1.0.1.
- The **descuento-precio-final feature** (Precio final column on /informacion, `formatPriceARS` helper, MESES_OPTIONS expansion, S2.D.4 test) was completed 2026-06-17 to 2026-06-19 AFTER the v1.0.0 release commit. The user-facing ROADMAP entry describes v1.0.0 as including the feature, but in this CHANGELOG it's tracked separately to preserve the actual release timeline. The 2 post-merge bugs (v1.0.1) were a direct result of the v1.0.0 → feature work gap.
- Pre-existing carryover issues (documented in Engram obs #215, #190) — `S2.D.3` SASL, `S2.D.4` cache invalidation — remain partially open. Tracked in `openspec/ROADMAP.md` §Pendiente for follow-up.

---

## [0.20.1] - 2026-06-13

1.0 prep tech debt batch — completes the 4 §"Sugerencias para 1.0 prep" recommendations.

### Added
- **GGA pre-commit hook** (`71a628e`) — wrapper script for `bash scripts/ggav2.sh` with diff-only post-filter. Composed of:
  - `.gga-ignore` parser (`2646999`): reads the project's `.gga-ignore` file at repo root, normalizes line numbers against the post-filter output.
  - `GGA output parser` (`ad49f52`): parses `ggav2.sh` JSON output into structured `LinterIssue[]` records.
  - `tests/scripts/gga-output-parser.test.ts` (`2d89462`): covers the parser edge cases (multi-line, unicode, edge-of-buffer).
  - `tests/scripts/gga-ignore-helper.test.ts` (`36462f6`): covers the ignore file matching.
  - `tests/scripts/gga-diff-filter.test.ts` (`0d26b0d`): covers the diff-only post-filter.
  - `scripts/install-gga-hook.sh` (`8967ce9`): one-command install via `git config core.hooksPath` + symlink.
  - `scripts/uninstall-gga-hook.sh` (`31cdd32`): clean removal.
  - `chore(tools): seed .gga-ignore with post-cleanup line numbers` (`e031064`): initial `.gga-ignore` populated with the current 137 pre-existing warnings so the hook doesn't false-positive on day 1.
- **`GYM_SINGLETON_ID` constant** (`1f60526`) — `src/lib/gym-constants.ts` exports the singleton id (`"gym"`) so the literal stops being hardcoded in `actions/promociones.ts` and `actions/descuentos-duracion.ts`. Carried over from the v0.20.0 tech debt review.

### Fixed
- **GGA-FOLLOWUP-1** — `Promise.all` en `src/app/(admin)/admin/page.tsx:55` (que no tenía `try/catch` ni `error.tsx` boundary, pre-existente de v0.18.0 Slice 1) wrapped con try/catch + ErrorState fallback. Parte del tech debt cleanup batch (`8300e2d`).
- **GGA-FOLLOWUP-3** — `getGymConfigForServer` (que cacheaba el return value completo, incluyendo Prisma `Decimal` para el precio) reemplazado por `getGymNameForServer(): Promise<string | null>` (`5f05a8e`). Usa `select: { nombre: true }` así no hay serialización de Decimal que pueda romper el client component.
- **GGA-FOLLOWUP-7** — Prisma migration workflow documentado en `CONTRIBUTING.md` §"Workflow de migraciones (no estándar)" (no usar `prisma migrate dev` después de cambios manuales en prod, usar `prisma db push` + `prisma generate`).

### Docs
- **GGA-FOLLOWUP-13** — Return-type consistency en `actions/feriados.ts`: `deleteFeriado` unificado a `Promise<FormState<{ id: string }>>` (era `Promise<FormState>`); caller type inference sin anotación explícita.
- **`CONTRIBUTING.md` §"GGA pre-commit hook"** (`3cd9ad5`) — documenta el nuevo hook, la sintaxis de `.gga-ignore`, y el `GGA_DIFF_FILTER=off` kill switch.

### Notes
- This is a **PATCH** bump per semver (0.20.0 → 0.20.1). The 1.0 prep recomendaciones 1, 2, 3, y 4 están ahora completas (ver ROADMAP §"Sugerencias para 1.0 prep" archive pointer).
- La expansión del v0.20.0 → v0.20.1 fue realmente grande (25+ commits sobre 2 días) porque agrupó todo el setup del GGA hook + las correcciones derivadas. Esto es lo que se hubiera llamado un v0.21.0 si el proyecto todavía estuviera en pre-1.0; el v0.20.1 refleja el model de "tech debt batch antes del 1.0".

---

## [0.20.0] - 2026-06-12

### Changed
- **Removed `typescript.ignoreBuildErrors: true` from `next.config.ts`**. The project's build is now strict — any new TypeScript error will fail `next build` immediately. The safety net that was hiding 14 pre-existing TypeScript errors is gone.
- **`pnpm tsc --noEmit` must report 0 errors** for any commit that lands on `main`. This is the new project invariant.

### Fixed
- **14 pre-existing TypeScript errors** fixed across 7 files:
  - 1 in `src/`: removed dead `cancelText` field from `useConfirm` call in `rutina-completa-form.tsx` (the field was being passed but never read by the `ConfirmDialog`)
  - 2 in `tests/`: wrong import paths in `tests/check-db-accounts.ts` and `tests/verify-password.ts` (was `'./generated/client'`, now `'../generated/client'`)
  - 2 in `tests/`: duplicate function names in `tests/check-detail-page2.ts` and `tests/check-full-body.ts` (both defined `async function main()` at top-level; fixed by wrapping in IIFE)
  - 4 in `tests/`: discriminated union narrowings in `tests/promocion-schemas.test.ts`
  - 5 in `tests/`: missing `string | null` return type in `tests/use-feriados-notification.test.ts` mock (the actual hook already handles `null` correctly; the test mock was the only piece that needed widening)

### Notes
- This is a **MINOR** version bump in pre-1.0 semver. The build safety-net removal is the most user-facing-impactful change since 0.19.0 (the cache migration).
- The 14 errors were pre-existing — the project was building fine with the `ignoreBuildErrors` safety net, but that safety net was hiding type errors from the developer. Now the project is honest about its type safety state.
- Verified with a sanity test: introducing a temporary TypeScript error caused `pnpm build` to fail (proving the safety net is definitively gone, not a placebo).
- 2 new GGA follow-ups registered:
  - `GGA-FOLLOWUP-4` (Medium): pre-existing E2E flakiness on `5.1.1` and `5.1.4` in `gym-config.spec.ts` — fix: add `retries: 1` to Playwright config
  - `GGA-FOLLOWUP-5` (Low): E2E test execution takes 5-8 minutes in this shell environment — consider a shell script to pre-start the dev server

### After this change
The remaining 1.0 prep items are:
- #3: E2E coverage for critical flows
- #4: GGA pre-commit hook diff-only
- Plus the carryover GGA follow-ups (#1 error handling, #2 revalidateTag casts, #3 Prisma Decimal serialization, #4-#5 new)

---

## [0.19.0] - 2026-06-11

### Changed
- **Migrated all cached data readers from `unstable_cache` (Next 15.x legacy) to `use cache` + `cacheTag` + `cacheLife` (Next 16 Cache Components)**. 11 readers across 8 files migrated: `getGymConfigForServer`, `getGymDisplayForServer`, `getRoutinesPaginated`, `getTrainerCounts`, `getRutinas`, `getCachedRutinaById`, `getStats`, `getGymPrice`, `getPromociones`, `getDescuentos`, `getFeriados`. The `getFeriados` 30s TTL is preserved (intentional for "new" badge freshness on the home page).
- **Enabled `cacheComponents: true` in `next.config.ts`**. Next.js 16 now uses Partial Prerendering (PPR) — pages that read from cached readers get a static shell with dynamic streamed content. This is the largest behavioral change in the project since 0.16.0.
- **Removed 7 `force-dynamic` flags** (6 admin pages + 1 API route). The `force-dynamic` flags were defeating the cache. With the flag now removed, admin pages benefit from cached readers + `revalidatePath` for write invalidation.

### Fixed
- **Latent `revalidateTag` gap in `actions/gym.ts:updateGymPrice`** — the function called `revalidatePath` but not `revalidateTag("gym-config")`, which would have caused stale data after a price update. Now fixed.
- **2 new GGA follow-ups registered** for the project ROADMAP:
  - `GGA-FOLLOWUP-2` (Medium): replace `(revalidateTag as any)` casts project-wide with the proper Next 16 two-arg signature `revalidateTag("tag", "max")`
  - `GGA-FOLLOWUP-3` (Low): serialize Prisma `Decimal` to `number`/`string` at reader boundaries for safe client component consumption

### Notes
- This is a **MINOR** version bump in pre-1.0 semver (signals a large behavioral change), but conceptually it's a "MAJOR" because the caching contract is now different. The user's explicit decision was to bump to 0.19.0.
- The slice ordering was revised mid-change: original plan had Slice 1 = enable flag, but Next 16 does a parse-time check that rejects `cacheComponents: true` + any `export const dynamic = "force-dynamic"`. The slices were reordered to remove all `force-dynamic` flags first, then enable the flag, then migrate readers.
- A prerequisite fix for the flag was required: `<Footer />` had to be wrapped in `<Suspense>` in `src/app/layout.tsx` (it uses `usePathname()` which is "uncached data" per Next 16 PPR semantics).
- Follow-up from the change: the remaining 1.0 prep items are #2 (TypeScript errors), #3 (E2E coverage), #4 (GGA hook).

---

## [0.18.2] - 2026-06-11

### Changed
- **Per-page admin `loading.tsx` files** for 6 admin pages (`/admin` dashboard, `/admin/rutinas`, `/admin/feriados`, `/admin/promociones`, `/admin/descuentos-duracion`, `/admin/trainers`). Each composing the matching skeleton component (`AdminStatsGridSkeleton`, `AdminRutinasTableSkeleton`, `AdminFeriadoRowSkeleton`, `AdminPromocionCardSkeleton`, `AdminDescuentoRowSkeleton`, `AdminTrainerRowSkeleton`) plus a custom header skeleton (page title + actions placeholders). The user now sees a skeleton that matches the destination page during the route transition, instead of the generic `(admin)/loading.tsx` placeholder. The generic route-group loading remains as the fallback for the 2 detail/edit pages (`/admin/rutinas/[id]`, `/admin/rutinas/[id]/dias/[diaId]`) where the generic is acceptable.

### Notes
- This is a PATCH release — pure UX polish, no new features

---

## [0.18.1] - 2026-06-11

### Changed
- **Routine navigation now feels instant**: `prefetch={true}` added to `RoutineCard` link so Next.js prefetches the destination route in the background; click on a routine card on the homepage now navigates immediately
- **`/rutinas/[id]` route now shows a page-shaped skeleton** (`RoutineDetailSkeleton`) during route transition instead of the generic `<DumbbellSpinner />` — matches the page layout so the user sees "this is the routine detail page" while it loads
- **Removed unused public route** `/rutinas/[id]/dias/[diaId]/` (page, loading, and orphan components `DayCard` + `DayDetailSkeleton`). The route was implemented in 2026-03 but never wired up in the UI. Admin route + API route + the `diaId` database FK concept are preserved (per user decision).

### Notes
- This is a PATCH release because the changes are UX polish (perceived perf) + dead code removal, not new features
- The 4 commits since v0.18.0 are: 2 `feat:` (loading.tsx files, eligible for MINOR) + 1 `perf:` (prefetch hint) + 1 `refactor:` (delete unused route). Per readme-guardian tiebreaker ("if doubt between MINOR and PATCH → use MINOR"), MINOR was possible, but PATCH is more honest about the user-facing impact (no new features)

---

## [0.18.0] - 2026-06-11

### Added
- **Generic `Skeleton` UI primitive** in `src/components/ui/skeleton.tsx` (`bg-muted animate-pulse rounded`, composable via className) — base for all page-shaped skeletons
- **Route-group loading files** for page-shaped loading UX: `src/app/(public)/loading.tsx` (homepage shape), `src/app/(admin)/loading.tsx` (admin shape with sidebar + main)
- **11 page-shaped skeleton components** (8 admin + 3 public): AdminStatsCardSkeleton, AdminStatsGridSkeleton, AdminRutinasTableSkeleton, AdminFeriadoRowSkeleton, AdminPromocionCardSkeleton, AdminDescuentoRowSkeleton, AdminTrainerRowSkeleton, AdminConfigSectionSkeleton, InformacionSkeleton, RoutineDetailSkeleton, DayDetailSkeleton
- **`getAdminSession` helper** in `src/lib/admin-session.ts` using `React.cache()` for per-request session deduplication in admin pages
- **4 new cached readers** using `unstable_cache` with `revalidateTag` for invalidation: `getGymPrice` (60s), `getPromociones` (60s), `getDescuentos` (60s), `getFeriados` (30s — for "new" badge freshness)

### Changed
- **Root `loading.tsx` rewritten** as a generic `<DumbbellSpinner />` centered fallback (was a homepage-shaped skeleton that incorrectly showed for every route, including admin pages)
- **`(public)/informacion/page.tsx`** refactored: dropped 4 sequential HTTP self-fetches to the own API routes; now uses `getGymDisplayForServer` + `getPromociones` + `getDescuentos` + `getFeriados` via `Promise.allSettled` (5 HTTP round-trips → 1 parallel Prisma query with caching)
- **`(public)/feriados/page.tsx`** refactored: dropped 2 sequential HTTP self-fetches; now uses cached `getFeriados` + direct Prisma query for latest date
- **4 admin pages** dedup `auth.api.getSession` via `getAdminSession` (rutinas, rutinas/[id]/dias/[diaId], trainers, config) — one DB call per request instead of one per page
- **3 server actions** call `revalidateTag` alongside `revalidatePath` for cache invalidation: `actions/promociones.ts` (tag `promociones`), `actions/descuentos-duracion.ts` (tag `descuentos-duracion`), `actions/feriados.ts` (tag `feriados`)
- **Build improvement**: `/feriados` and `/informacion` are now `○ Static` (was `ƒ Dynamic`); the pre-existing `dynamic-server-usage` build warning is GONE

### Fixed
- E2E test 4.10 (homepage `.animate-pulse` visibility) — structurally fixed by adding `(public)/loading.tsx` which uses the `Skeleton` primitive
- `/feriados` and `/informacion` were doing 5 and 2 uncached HTTP round-trips to their own API routes on every request; now hit cached Prisma readers

---

## [0.17.0] - 2026-06-10

### Added
- **Structured per-day hours form** at `/admin/config` → Schedule sub-form — admin now configures hours via 7 day cards (Lun, Mar, Mié, Jue, Vie, Sáb, Dom) each with `abierto: boolean` + `apertura: time | null` + `cierre: time | null`, replacing the previous free-text `horario` textarea
- New `horarioJson: Json?` field on the Gym singleton (Postgres `jsonb`), Zod-validated as a `HorarioSemanal` object at every read boundary
- New Zod schemas: `horarioDiaSchema` (per-day shape) + `horarioSemanalSchema` (7-day aggregate) in `src/lib/schemas.ts`
- New pure formatter `formatHorario(horario: HorarioSemanal): string | null` in `src/lib/informacion/format-horario.ts` — groups consecutive open days with identical hours, separates groups with " · ", spells out closed days, returns `null` if all 7 days are closed (hides the section)
- New admin component `<WeeklyScheduleEditor>` in `src/components/admin/WeeklyScheduleEditor.tsx` — 7 day cards in a responsive grid, `<input type="time">` for apertura/cierre, sonner toast on save
- New server reader `getGymDisplayForServer` (Zod-narrowed snapshot tagged `"gym-config"`) for type-safe read boundaries
- 15 unit tests for the new Zod variants + 10 unit tests for `formatHorario` (covering all spec'd examples + edge cases)

### Changed
- `GET /api/gym` and `PATCH /api/gym` no longer accept/return the `horario: string` field; replaced by `horarioJson: HorarioSemanal | null`
- `gymFieldSchema` discriminated union: the `horario` variant is replaced by `horarioJson` (value is the full weekly object or `null`)
- Public `HoursSection` rewritten as a pure formatter wrapper around `formatHorario` — admin free-text no longer reaches the public page, the application controls the render format
- Schedule sub-form in `GymConfigManager` no longer uses the `FieldConfig` abstraction — replaced by the standalone `<WeeklyScheduleEditor>` peer card (avoids touching the other 3 sub-forms)
- `GymDisplay` type: dropped `horario: string | null`, added `horarioJson: HorarioSemanal | null`

### Fixed
- Public render is now **deterministic and app-controlled** — `"Lun a Vie 8:00 a 22:00 · Sáb 9:00 a 14:00 · Dom cerrado"` style output is generated by the application, not by admin free-text. No more inconsistent branding across deploys.
- `GymConfigManager` `FieldFormState.value` widened from `string` to `unknown` to accommodate the new object-typed value

### Removed
- `horario: String?` column dropped from the Gym model (was a free-text field, incompatible with the new structured format). No data preservation (pre-launch, project is yours, no users).

---

## [0.16.0] - 2026-06-10

### Added
- **Admin gym configuration page** at `/admin/config` — admin can now edit gym display name, hours, address, Google Maps embed URL, Instagram URL, and WhatsApp URL from the admin panel
- New Gym model fields: `nombre`, `horario`, `direccion`, `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp` (all nullable, additive migration)
- Extended `GET /api/gym` and `PATCH /api/gym` with the new display fields (Zod-validated)
- Per-field server action `updateGymField` with discriminated union, role check, and cache invalidation
- Cached server reader `getGymConfigForServer` using `unstable_cache` with `cacheTag("gym-config")` + 60s TTL
- Centralized fallback chain `DB → NEXT_PUBLIC_GYM_NAME → "Gimnasio"` via `resolveGymName` helper in `src/lib/gym-display.ts`
- Sidebar nav: new "Configuración" entry visible only to ADMIN role (TRAINER still sees Rutinas + Feriados)
- 28 unit tests for the gym field Zod schema, 10 E2E tests covering the admin flow, fallback chain, and auth gate

### Changed
- Root layout `metadata` migrated from static `export const metadata` to `generateMetadata()` (DB-driven with env var + generic fallback)
- Public homepage, loading skeleton, and admin sidebar now read gym name from the database (no more hardcoded brand string)
- `/informacion` page: HoursSection, AddressSection, and SocialLinksSection now accept nullable props and render nothing when the corresponding field is null (no fake data)
- Login page: gym name now sourced from `NEXT_PUBLIC_GYM_NAME` env var instead of being hardcoded
- Admin sidebar filter: refactored from hard-coded TRAINER allowlist to a declarative `adminOnly: true` flag per nav item

### Fixed
- Login page no longer renders a specific client's gym name as a hardcoded fallback (privacy/branding leak across deploys)
- 2 pre-existing stale Playwright assertions updated for the dynamic metadata model

---

## [0.15.1] - 2026-06-09

### Fixed
- Proxy middleware: removed `"/"` from publicPaths so admin routes are properly protected (was matching all paths via startsWith)
- Feriados notification: added 5-minute throttle to window.focus handler to prevent excessive refetches on alt+tab

### Changed
- Home page: extracted trainer counts into separate cached query (`getTrainerCounts`) to avoid duplicate groupBy + user lookup
- Home page: moved paginated routine list into streaming Suspense boundary — header and search render immediately, cards stream with skeleton fallback
- Cached `getRoutinesPaginated` with `unstable_cache` (30s TTL, shared "rutinas" tag with mutations)
- loading.tsx: replaced dumbbell spinner with skeleton layout matching exact page structure (zero layout shift)
- Dev server: removed `--webpack` flag — now uses Turbopack (compile times reduced from 18s to 3s)
- Dev dependency: vitest `^4.1.1` → `^4.1.8`

---

## [0.15.0] - 2026-06-08

### Changed
- Migrated package manager from npm to pnpm (v11.2.2) for faster installs, content-addressable disk efficiency, and stricter dependency isolation
- Lockfile: replaced `package-lock.json` with `pnpm-lock.yaml`
- Added `.npmrc` with `shamefully-hoist=false`, `strict-peer-dependencies=true`
- Added `packageManager` field to `package.json`
- Updated all build scripts: `npx` → `pnpm dlx` in `db:seed`, `prisma.seed`, and `prisma.config.ts`
- Updated `playwright.config.ts` webserver command: `npm run dev` → `pnpm run dev`
- Updated `openspec/config.yaml`: `Package manager: npm` → `pnpm`
- `README.md` and `CONTRIBUTING.md`: all CLI examples migrated to `pnpm` / `pnpm dlx`

---

## [0.14.1] - 2026-04-24

### Fixed
- updateTrainer: password ahora se hashea una sola vez y se actualiza solo en Account (no en User)

---

## [0.14.0] - 2026-04-24

### Added
- TrainerDialog component with create/edit modes (Base UI Dialog)
- Password visibility toggle on trainer create/edit forms
- Dialog animations (fade-in, zoom-in) with backdrop blur matching project styles
- DNI input: max 8 numeric characters with inputMode=numeric

### Changed
- Trainer manager refactored: inline forms replaced with dialog triggers
- trainer-manager.tsx: 302→146 líneas (removed ~156 lines of inline form code)
- Dialog-based UI replacing inline create/edit workflows

---

## [0.13.0] - 2026-04-24

### Added
- Role enum system (ADMIN/TRAINER/USER) replacing admin boolean
- Trainer CRUD page (/admin/trainers) with soft-delete
- Role-based auth helpers (isAdmin, isTrainer, isAdminOrTrainer)
- Sidebar navigation filtering by role (ADMIN sees all, TRAINER sees only Rutinas/Feriados)
- Routine ownership isolation (trainers can only CRUD their own rutinas)

### Changed
- Admin layout: auth gate uses role instead of admin boolean
- All server actions migrated from `admin: boolean` to `role` enum
- Better Auth sign-up disabled via disabledPaths

### Removed
- admin boolean field from User model (replaced by role enum)

---

## [0.12.1] - 2026-04-15

### Fixed
- Pagination: separate where clause for trainer counts to enable multi-select on home page filters

---

## [0.12.0] - 2026-04-15

### Added
- Pagination: add server-side pagination for routines on home page (Prisma with page/limit)
- Pagination: add error-state and empty-state UI components
- Pagination: add pagination controls with prev/next Link buttons
- Pagination: add PAGE_SIZE constant (12)

### Changed
- Replace getFilteredRutinas (fetch all + in-memory filter) with getRoutinesPaginated service
- Delete extractTrainers helper

---

---

## [0.11.1] - 2026-04-15

### Fixed
- **Trainer counts multi-select fix** — `3fd1d9e fix(home): separate where clause for trainer counts to enable multi-select on home page filters`. Pre-existente de v0.11.0, where clause unificado entre `findMany` y `groupBy` causaba que solo 1 trainer se contara cuando varios estaban seleccionados.

### Notes
- This is a **PATCH** bump per semver (0.11.0 → 0.11.1). Cambio de 1 línea, hotfix de comportamiento de UI en home.

---

## [0.11.0] - 2026-04-15

### Added
- SeriesRepsInput: nuevo componente para entrada de series/reps separados (3 columnas)
- Tests para formato helpers (parseFormato, parseInitialFormat, combineToFormat)

### Changed
- Zod schemas: refactor de formato string (4x12) a campos separados series/repes
- EjercicioForm: nuevo layout 3 columnas (nombre + series + repes) alineados por baseline
- EjercicioRow: usa SeriesRepsInput en vez de input texto simple
- Server actions (createEjercicio/updateEjercicio): usan schema flatten en vez de extraer formato
- Grid de rutina-form: md:grid-cols-[1fr_auto] para distribución Nombre/Tipo correcta

### Fixed
- TagInput: Array.isArray check para prevenir TypeError cuando field.value no es array
- SegmentedControl: comportamiento responsive mobile (scroll+Snap) / desktop (sin overflow), hover condicional en selected state

### Docs
- AGENTS.md: agregar frontend-design skill reference

---

## [0.10.6] - 2026-04-14

### Fixed
- DescuentoDuracionManager: agregar estilos hover visibles en botones de editar/eliminar
- FeriadoManager: validar que hora inicio sea menor que hora fin

---

## [0.10.5] - 2026-04-14

### Fixed
- DescuentoDuracionManager: separar layouts de CreateMode/EditMode para evitar que el Select se mueva al activar edición

---

## [0.10.4] - 2026-04-14

### Fixed
- Mensajes de error en español para validación de precio en schemas de promociones (createPromocionSchema, updatePromocionPrecioSchema) y descuento duración (createDescuentoDuracionSchema)

---

## [0.10.3] - 2026-04-14

### Changed
- Mejora visual en tarjetas de promociones: borde izquierdo verde (border-l-4 border-l-primary), título con font-semibold, precio renderizado como Badge con bg-primary/10 text-primary

---

## [0.10.2] - 2026-04-14

### Fixed
- Removido botón redundante "Crear primera promoción" en lista vacía de promociones
- Formulario ahora se vacía correctamente al cancelar edición de promoción
- Campo precio vacío por defecto (undefined en lugar de 0)
- Tipo `any` removido en createPromocion, usado PromocionFormState tipado
- Type cast duplicado en errors de precio reemplazado por helper errorsMap

---

## [0.10.1] - 2026-04-14

### Fixed
- Form submit no disparaba por lifecycle violations en RHF (dynamic resolver, key remount)
- RHF ahora usa single resolver estable para ambos modos (create/edit)
- Removido `<label>` wrapper del Switch que interfería con form

---

## [0.10.0] - 2026-04-14

### Added
- Componentes modulares para admin promociones: PromocionCard, PromocionForm, PromocionList, PromocionStatusBadge
- Switch component reutilizable con soporte labels y colores verde/gris
- Tests E2E para flujo de promociones (Playwright)
- Tests unitarios para schemas de promociones (Vitest)

### Changed
- Schema Promocion: campo `precio` de String a Int (CRITICAL)
- Server Actions de promociones refactorizadas en acciones atómicas: updatePromocionContent, updatePromocionPrecio, togglePromocionActivo
- Admin panel de promociones con layout 2 columnas (desktop) y stacked (mobile)
- Input y Textarea con mejor contraste (bg-background en lugar de bg-transparent)
- Switch con group-data-[checked] para animaciones suaves

### Fixed
- Form inputs con React Hook Form (controlled/uncontrolled mismatch)
- Precio en edit mode ahora muestra valor correcto de la DB
- Labels de switch usan props.checked en lugar de data-* selectors inválidos

### Removed
- Legacy updatePromocion action (reemplazado por acciones atómicas)
- Toast notifications en toggle de promociones

---

## [0.9.0] - 2026-04-13

### Added
- Rediseño completo de `/informacion` con 7 componentes modulares (PriceSection, PlansSection, DurationDiscountsSection, HoursSection, AddressSection, SocialLinksSection, CollapsibleSection)
- Sección Promociones y Descuentos como collapsibles con animación suave
- Mapa embebido de Google Maps para ubicación del gimnasio
- Links directos a Instagram y WhatsApp del gimnasio

### Changed
- Page.tsx refactorizado de 438 a 153 líneas usando componentes modulares

---

## [0.8.1] - 2026-04-13

### Fixed
- Notification badge de feriados restaurado en BottomBar (mobile) y SearchSection (desktop)

---

## [0.8.0] - 2026-04-13

### Added
- User dropdown en sidebar footer con theme toggle y logout

### Changed
- Admin layout: header removido, sidebar ocupa h-screen completo
- Mobile: hamburger flotante top-left para abrir drawer

### Fixed
- Pluralización correcta "1 día" vs "N días" en rutinas recientes
- Stats cards con íconos monocromáticos (bg-secondary, text-muted-foreground)
- Sidebar con indicador visual de ruta activa (border-l-2 border-primary)
- Tipo de rutina mostrado como badge en rutinas recientes

---

## [0.7.0] - 2026-04-12

### Added
- Admin sidebar de navegación con items: Rutinas, Feriados, Promociones, Descuentos
- Botón "Nueva Rutina" en sidebar → /admin/rutinas/new
- Drawer lateral en mobile (Sheet) con hamburger en header

### Fixed
- Tipos TypeScript alineados con Prisma schema (series, nombre en Dia/DiaDetail, musculosEnfocados)
- Build pasa sin errores en src/ (0 errores TS)

### Changed
- Admin layout: sidebar fijo desktop (256px), contenido con ml-64
- Header admin simplificado: solo logo/título + nombre de usuario
- Dashboard admin: eliminada sección "Acciones Rápidas" (navegación vía sidebar)

---

## [0.6.0] - 2026-04-12

### Added
- Modelo `Promocion` (titulo, descripcion, precio, activo) con CRUD admin completo
- Modelo `DescuentoDuracion` (meses, porcentaje) con unique constraint (gymId, meses) y CRUD admin
- Página `/admin/promociones` para gestionar promociones activas
- Página `/admin/descuentos-duracion` para gestionar descuentos por duración
- Display de promociones activas en `/informacion`
- Tabla de descuentos por duración en `/informacion`
- Quick actions en admin dashboard linking a ambas páginas
- Navegación lateral admin con links a promociones y descuentos
- Seed data: 3 promociones y 4 descuentos por duración (3/6/9/12 meses → 10/15/17/20%)

### Changed
- `/informacion` ahora incluye secciones de promociones y descuentos
- Prisma schema: nuevos modelos y relaciones con Gym

---

## [0.5.1] - 2026-04-10

### Changed
- Home page: título display "Champion Gym" text-4xl sm:text-5xl font-black centrado
- TrainerFilterDrawer: pills con text-base (16px), drawer min-h-[40vh], botón Filtrar variant="outline"
- TrainerPills: layout vertical (flex-col) con w-full
- TrainerSidebar: label "Entrenadores" text-xs uppercase tracking-wide

---

## [0.5.0] - 2026-04-10

### Added
- Mobile-first redesign de homepage: layout responsive con bottom bar para navegación móvil
- TrainerFilterDrawer: bottom sheet con filtros de entrenador para móvil (Sheet de shadcn)
- BottomBar: barra fija de navegación móvil con links a Información y Feriados
- TrainerPills: pills de entrenador para desktop (reemplaza sidebar)
- Componentes shadcn/ui instalados: Sheet, ScrollArea

### Changed
- Header: eliminado subtítulo genérico
- RoutineCard: removida línea "Creado por X" y simplificado layout
- SearchSection: desktop icon links para Info/Feriados, mobile filter trigger
- page.tsx: layout mobile-first (header → search → filter → cards → bottom bar)
- Theme audit: todos los componentes afectados usan CSS var tokens

### Fixed
- SheetTrigger: corregido nested button HTML error usando className directo en lugar de render prop
- TrainerFilterDrawer: reemplazado Button por div con role=button para evitar nesting

---

## [0.4.0] - 2026-04-09

### Removed
- Campo `nombre` del modelo `Dia` en Prisma — nombre ahora se deriva del `orden`

### Changed
- Display de días: reemplazado `{dia.nombre}` por `Día {orden}` en todos los componentes
- Admin forms: eliminado input "Nombre del día"
- Server actions: `createDia`, `updateDia` ya no usan `nombre`
- API responses: eliminado `nombre` de respuestas JSON de días

### Fixed
- `createRutinaCompleta` y `updateRutinaCompleta`: removido referencia a `diaData.nombre`

---

## [0.3.0] - 2026-04-09

### Added
- Stats summary en `/rutinas/[id]`: 3 badges read-only (días, ejercicios, series) con íconos Lucide (Calendar, Dumbbell, Zap)
- Accordion nativo `<details>/<summary>` por día — reemplaza Card grid clickeable

### Fixed
- series×reps: ahora muestra `{series}×{reps}` con null check en vez de solo `{series}` en vista pública

### Changed
- Descripción de rutina movida debajo del badge tipo/creador, alineada a la izquierda
- Lista completa de ejercicios por día (removido truncamiento "+X más")

## [0.2.6] - 2026-04-09

### Added
- TagInput component: reusable tag input for admin forms with Enter/Space creates tag, x removes, Backspace on empty removes last tag

### Changed
- musculosEnfocados: migrated from `String` (comma-separated) to `String[]` in Prisma schema
- Admin forms (dia-section, rutina-completa-form, rutina-edit-form, routine-day-card, dia-manager): now use TagInput for musculosEnfocados
- Display components (day-card, dia-card, routine-day-card): render musculosEnfocados as badges instead of single string
- Server actions (dias.ts, rutinas.ts): use FormData.getAll() for array handling
- API routes: return string[] directly for musculosEnfocados

### Breaking
- musculosEnfocados is now stored as PostgreSQL text[] array, not comma-separated string
- Client components expecting string must now handle string[]

## [0.2.5] - 2026-04-08

### Fixed
- seed-refactor: removed hardcoded passwords from prisma/seed.ts (moved to SEED_ADMIN_PASSWORD_1/2/3 env vars)
- seed-refactor: replaced fragile regex URL parsing with `new URL()` constructor
- seed-refactor: changed `process.exit(1)` to `process.exitCode = 1` for proper finally block execution
- seed-refactor: replaced default `pg` import with named `import { Pool } from 'pg'`
- seed-refactor: added explicit `return await prisma.$disconnect()` in main()

### Changed
- .env.example: added SEED_ADMIN_PASSWORD_1/2/3 entries for seed script documentation

### Reverted
- seed-refactor: reverted incorrect change to `providerId: 'username'` (must remain `providerId: 'credential'` for better-auth username plugin)

### Known Issues
- seed-refactor introduced regression that broke admin login (providerId mismatch) — manually corrected post-commit

## [0.2.4] - 2026-04-07

### Fixed
- tipo-rutina: normalización de case en seed y display (valores en lowercase: `fuerza`, `cardio`, `flexibilidad`, `hipertrofia`)
- tipo-rutina: seed corregido (`Funcional` → `fuerza`/`flexibilidad` según descripción de rutina)
- UI: reemplazados `blue-500` hardcodeados por semantic tokens (`primary`)
- UI: removidos gradient overrides que rompían dark mode en Cards

## [0.2.3] - 2026-04-04

### Fixed
- RutinaEditForm: form no se actualizaba al navegar entre rutinas (useEffect con initialData?.id para sincronizar estado con rutina actual)

## [0.2.2] - 2026-03-31

### Fixed
- RutinaCompletaForm: ejercicio drag-and-drop no funcionaba (faltaban `ejercicioIndex` y `diaIndex` en sortable data)
- RutinaCompletaForm: day reorder causaba pérdida de campos `nombre` y `musculosEnfocados` en drags subsiguientes (memo causaba re-renders omitidos, key forzada `${field.id}-${index}` + `diaIndex` prop directo)
- usePersistedForm: state corruption durante drag (persistía estados transitorios via `useWatch`), agregado flag `skipPersistence` para pausar persistencia durante operaciones DnD

### Changed
- EjercicioRow: props ahora incluyen `diaIndex` y pasa `ejercicioIndex` en sortable data
- DiaSection: sin `React.memo()`, usa key forzada `${field.id}-${index}`, `baseName` calculado en el map del padre y pasado como prop

## [0.2.1] - 2026-03-30

### Fixed
- RutinaCompletaForm: error "uncontrolled to controlled" en inputs (forwardRef + value ?? "")
- RutinaCompletaForm: form reset al drag de ejercicios (name del map() en vez de indices reconstruidos)
- RutinaCompletaForm: form reset al drag de dias (shouldUnregister: false en useFieldArray)
- RutinaCompletaForm: hydration mismatch por IDs de dnd-kit (ssr: false en wrapper client)
- Input/Textarea: falta de forwardRef para integracion correcta con RHF Controller
- Schemas: .default("") en campos opcionales (formato, musculosEnfocados)

### Changed
- Arquitectura: page.tsx ahora es Server Component, form aislado en wrapper client
- rutinax-form-client.tsx: nuevo archivo para encapsular DnD con dynamic ssr:false
- uso de Controller en vez de register para nombre, descripcion, tipo de rutina

## [0.2.0] - 2026-03-28

### Fixed
- Ejercicio form: unified series/repes to single "4x12" formato input
- Ejercicio form: validation error when leaving series/repes empty (NaN bug)
- Ejercicio mutations: revalidatePath now uses exact route (/admin/rutinas/[id]/dias/[diaId])
- Dia creation: auto-generates "Día N" nombre instead of requiring user input
- Series/repes: changed from String to Int in Prisma schema

### Changed
- ejercicio-form.tsx: single formato input instead of separate series/repes
- dia-manager.tsx: no longer requires nombre input for new days
- Schemas: new createDiaSchema (rutinaId only), formato field with refine+transform

### Added
- Toast notifications for ejercicio CRUD operations
- router.refresh() after mutations for immediate UI updates

## [0.1.1] - 2026-03-27

### Changed
- README: Mark PDF generation as pending (not implemented)
- README: Add TODO section with completed/pending features
- README: Fix Spanish/English mixed text in Troubleshooting
- PRD: PDF moved to backlog, Phase 2 marked as pending

### Added
- README: TODO section with full project status tracking

## [0.1.0] - 2026-03-25

### Added
- Initial documented state with full tech stack
- All Phase 1-3 features implemented and documented
