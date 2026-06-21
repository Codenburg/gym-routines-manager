# Roadmap

_Last updated: 2026-06-18_ | _Version: 1.0.0_

---

## ✅ Completado

### Funcionalidades
- [x] **v1.0.2** — Post-merge bugs 1 y 2 del descuento-precio-final (2026-06-21) — fix Zod schema meses 1-12 + fix Precio final a total upfront cost (base × (1 - pct/100) × meses) — `TBD` + `TBD`
- [x] **v0.6.0** — Promociones y descuentos por duración (modelo + admin CRUD)
- [x] **v0.7.0–v0.8.0** — Sidebar admin: nav con drawer mobile + footer con user dropdown / theme toggle / logout
- [x] **v0.10.0–v0.10.5** — Admin promociones refactor (acciones atómicas); borde izquierdo verde, jerarquía de título, badge de precio; errores de validación en español; fix jump del Select en CreateMode/EditMode
- [x] **v0.13.0** — Sistema de roles ADMIN/TRAINER/USER; trainer CRUD con soft-delete y aislamiento de rutinas propias
- [x] **v0.14.0** — Trainer manager: dialog-based UI para create/edit
- [x] **v0.15.1** — Notificación feriados throttle 5min; home caching + Suspense; proxy middleware (publicPaths); webpack → Turbopack; eliminación de queries duplicadas de trainer counts
- [x] **v0.16.0** — Configuración de gimnasio desde admin (nombre, horarios, dirección, redes, precio); fallback chain `DB → env var → "Gimnasio"` genérico; `unstable_cache` con `cacheTag("gym-config")` + 60s TTL; `resolveGymName` helper
- [x] **v0.17.0** — Horario estructurado (form por día, 7 day cards Lun-Dom) + render app-controlled; Zod-validated `HorarioSemanal` + 15 unit tests; pure `formatHorario` formatter + 10 unit tests
- [x] **v0.18.0** — Page loading overhaul: `Skeleton` primitive + 11 page-shaped skeletons + 3 `loading.tsx` route-group; `getAdminSession` con `React.cache()` dedup; 4 cached readers nuevos (`getGymPrice`, `getPromociones`, `getDescuentos`, `getFeriados`) con `unstable_cache` + `revalidateTag`
- [x] **v0.20.x** — Migración `unstable_cache` → `'use cache'` (cacheComponents); fix 14 TS errors pre-existentes + `ignoreBuildErrors` removido; E2E coverage de flujos críticos (rutinas, feriados, promos, descuentos, trainers, auth); GGA pre-commit hook con diff-only + `.gga-ignore`
- [x] **v1.0.0** — Public site con `Precio final` calculado en admin y `/informacion` para descuentos por duración (gym price × (1 - %)) — `cfd2ba4` + `203c4bf` + `266f7eb`

### Features núcleo (v0.1–v0.5)
- [x] Exploración de rutinas por nombre y tipo + detalle con días y ejercicios
- [x] Login admin con DNI (Better Auth)
- [x] CRUD de rutinas, días, ejercicios con drag-and-drop (`@dnd-kit`) y duplicado
- [x] Edición de precio de inscripción
- [x] Gestión de feriados (días no laborables, horarios parciales, unique date constraint)
- [x] Tema claro/oscuro con persistencia
- [x] Página de información del gimnasio
- [x] Búsqueda unificada con debounce y URL como source of truth

### Técnico
- [x] Next.js 16.1.6 + React 19.2.3
- [x] TypeScript strict mode (sin `ignoreBuildErrors`)
- [x] Tailwind CSS v4 + shadcn/ui
- [x] Zustand para estado global (theme)
- [x] Zod v4 + React Hook Form para validación
- [x] Prisma 7 + PostgreSQL 18
- [x] Server Actions para mutaciones
- [x] Cache invalidation con `revalidatePath`/`revalidateTag` + `'use cache'` + `cacheTag` + `cacheLife`
- [x] Ownership audit trail en base de datos
- [x] User soft delete
- [x] Unit tests con Vitest
- [x] E2E tests con Playwright
- [x] Pre-commit hook GGA (opt-in, diff-only)

### Documentación
- [x] README.md (hero, badges, TOC, secciones agrupadas)
- [x] PRD.md con roadmap y fases
- [x] LICENSE (AGPL-3.0)
- [x] Specs en `openspec/`

---

## ⏳ Pendiente

### Alta Prioridad
- [ ] **Multi-tenant SaaS — path a `gymflow`** — convertir el proyecto actual (single-tenant con `gymId: "gym"` hardcoded en todos lados) en una plataforma SaaS multi-tenant que pueda ofrecer el producto a múltiples gimnasios. El proyecto ahora se llama `gymflow` (anteriormente `gym-routines-manager`, renombrado como Slice 0 de este cycle — mejor branding, no ata el producto a "rutinas" solamente).

  **Scope inicial (idea del usuario)**:
  - Todos los modelos Prisma ganan `gymId` foreign key (rutinas, feriados, promociones, descuentos, trainers, gym config, etc).
  - Sistema de tenant resolution (cómo el request identifica a qué gym pertenece — ver open questions).
  - Auth multi-tenant: un user puede pertenecer a N gyms con roles por gym.
  - Migración de datos existentes: la DB actual tiene un solo gym con `id: "gym"` — se convierte al primer tenant.
  - Cache invalidation con tenant context (`cacheTag("gym:{gymId}:...")` pattern).
  - UI admin: gym selector si el user pertenece a varios gyms; branding por gym (nombre, logo, colores básicos).
  - Cara pública: cada gym tiene su propia `/informacion` + listado de rutinas, accesibles por su subdominio/path.

  **Pendiente**: necesita SDD cycle propio (`/sdd-new multi-tenant-gymflow`) — proposal + design + tasks + apply + verify + archive. **Slice 0 (pre-requisito aislado)**: rename del proyecto a `gymflow` (package.json, imports, docs, GitHub repo rename, remote URL, deploy configs). No toca lógica, se puede hacer en PR chico aparte antes del ciclo principal.

  **Open questions** (a resolver en la fase de proposal):
  - [ ] **Tenant resolution strategy**: ¿subdominio (`gymA.gymflow.app`)? ¿path-based (`/g/gymA/...`)? ¿custom domain (`gymA.com` → gymflow)? Asumir subdominio como default (más simple, mejor branding, SEO-friendly), custom domain como stretch goal.
  - [ ] **User ↔ gym relationship**: ¿un user pertenece a N gyms con roles por gym (`UserGymMembership { userId, gymId, role }`), o siempre 1 gym por login (gym scopado en sesión)? Multi-membership es más flexible, single-gym es más simple.
  - [ ] **Roles por gym o globales**: relacionado al anterior. Si multi-membership, los roles (ADMIN/TRAINER) son por gym o son globales? Asumir per-gym.
  - [ ] **Super-admin / platform owner**: ¿hay un rol "platform admin" que gestiona todos los gyms (onboarding, billing, suspension)? Necesario para SaaS.
  - [ ] **Pricing/billing durante el multi-tenant cycle**: ¿se implementa el sistema de cobro (subscriptions, plans, Stripe, invoices) **dentro** del multi-tenant cycle, o se arranca **gratis (free / beta)** durante el cycle y el sistema completo de billing va en un **SDD cycle aparte** después? **Sugerido**: free durante este cycle. Razón: el foco del multi-tenant cycle es validar que el producto multi-tenant funciona (tenant resolution, auth, isolation, caching por tenant) — agregar billing al mismo tiempo infla el scope y desacelera la validación. Approach típico de SaaS en etapa temprana: validar producto primero, monetizar después. El sistema completo de billing (planes, Stripe, invoices, dunning) queda para un SDD cycle posterior dedicado. Si un gym piloto necesita pagar antes, agregar un módulo mínimo de billing como **stretch goal** del último slice del cycle.
  - [ ] **Migración de datos existentes**: ¿se mantiene el gym actual con `id: "gym"` como el primer tenant (`gymId` slug = `"gym"` o renombrar a slug real), o se hace fresh start? Sugerido: mantener y renombrar a un slug real (`"codenburg"` o el nombre del cliente actual).
  - [ ] **Branding per-gym**: ¿solo nombre + logo, o también color theme por gym (CSS vars por tenant)? Fase 1: nombre + logo. Theme por gym: stretch.
  - [ ] **Cache strategy**: cambiar todos los `cacheTag` actuales de `"gym-config"` a `"gym:{gymId}:config"` (o similar). Impacto: cada reader pasa a tomar `gymId` como parámetro.
  - [ ] **DNS / SSL para subdominios wildcard**: si se elige subdominio, configurar `*.gymflow.app` con wildcard SSL. Depende del host (Vercel lo soporta out-of-the-box).
  - [ ] **Tests E2E multi-tenant**: nuevo suite `tests/multi-tenant.spec.ts` que verifique isolation (gym A no ve datos de gym B), onboarding flow, super-admin flow.

  **Severidad**: Alta. Es el path a producto comercial — sin esto, el proyecto se queda en single-tenant para un solo cliente. Alineado con el deseo del usuario de ofrecer el producto a varios gyms.

  **Slices estimados**: 6-8 slices (rename → schema → tenant resolution → auth → cache → UI selector → branding → tests → billing opcional).

- [ ] Tests E2E con cobertura completa (Playwright) — Fase 4
- [ ] Documentación de API (MDX-based)

### Media Prioridad
- [ ] Generación de PDF por rutina (@react-pdf/renderer)
- [ ] Cache warming cron para SEO
- [ ] **`GGA-FOLLOWUP-4`** — pre-existing E2E flakiness on `5.1.1` y `5.1.4` en `gym-config.spec.ts`. Root cause: `fullyParallel: true` + timing pollution on `saveField` server actions. Fix sugerido: `retries: 1` en Playwright config. (Descubierto durante Recomendación 2 del 1.0 prep.)
- [ ] **`GGA-FOLLOWUP-5`** — E2E test execution tarda 5-8 minutos en este shell environment. Pre-starting dev server con `pnpm dev` en background funciona. (Descubierto durante Recomendación 2 del 1.0 prep.)
- [ ] **`cleanTestData` partial** — solo `/api/feriados` tiene DELETE; otras APIs usan UI cleanup. (Descubierto durante Recomendación 3 del 1.0 prep.)
- [ ] **3 page-object dead locators** — `FeriadoAdminPage.addButton/errorMessage/deleteByFecha`, `DescuentoAdminPage.maxMesesInput`, `TrainerAdminPage.softDeleteByDni`. Harmless, unused by specs; future cleanup. (Descubierto durante Recomendación 3 del 1.0 prep.)
- [x] GGA-FOLLOWUP-1 (`Promise.all` en `src/app/(admin)/admin/page.tsx` sin `try/catch` o `error.tsx` boundary. Pre-existente de v0.18.0 Slice 1). **RESUELTO** en commit `8300e2d` (tech debt cleanup batch) — wrap con try/catch + ErrorState fallback.
- [x] GGA-FOLLOWUP-7 (Prisma migration workflow documentation, Baja). **RESUELTO** en commit `8300e2d` — documentado en `CONTRIBUTING.md` §"Workflow de migraciones (no estándar)".
- [x] GGA-FOLLOWUP-13 (Return-type inconsistency en `actions/feriados.ts` — `deleteFeriado: Promise<FormState>` vs `createFeriado`/`updateFeriado: Promise<FormState<{ id: string }>>`). **RESUELTO** en commit `8300e2d` — unificado a `Promise<FormState<{ id: string }>>`, caller type inference (no annotation).
- [x] **Migrar `unstable_cache` → `use cache` (Next 16 Cache Components)** — habilitar `cacheComponents: true` en `next.config.ts` y reescribir TODOS los readers con `'use cache'` + `cacheTag` + `cacheLife`. **También remover los 6 `export const dynamic = "force-dynamic"`** de las admin pages. Verificar que cada server action de mutación llame `revalidateTag` además de `revalidatePath`. **COMPLETED in v0.19.0** — pero con 2 follow-ups nuevos descubiertos:
  - `GGA-FOLLOWUP-2` (Medium): replace `(revalidateTag as any)` casts project-wide con `revalidateTag("tag", "max")` (Next 16 two-arg signature)
  - [x] `GGA-FOLLOWUP-3` (Low): Prisma Decimal serialization en `getGymConfigForServer` para client components. **RESUELTO** commit `5f05a8e` — `getGymConfigForServer` reemplazado por `getGymNameForServer(): Promise<string | null>` (usa `select: { nombre: true }`). Bug venía de `"use cache"` cacheando el return value completo.
- [ ] **Git index corruption recurrente** — `git fsck` reporta missing blobs en `openspec/changes/<new>/*` después de cada cambio nuevo. Workaround actual: `git update-index --force-remove` + re-add. Root cause probable en `.engram/config.json` o interacción con GGA hook. Investigar y resolver de raíz (v0.17.0 follow-up)
- [x] **E2E test 5.2.3 isolation issue** — `tests/gym-config.spec.ts:5.2.3` falla cuando corre después de 5.2.1 en el mismo suite. **RESUELTO en v0.20.1** — `test.describe.configure({ mode: 'serial' })` + file-level `test.afterEach(resetGymConfig)` con `tests/utils/gym-reset.ts` (direct prisma access, scoped + JSDoc'd). Ver Recomendación 3.
- [x] **`revalidatePath("/admin/descuentos")` no matchea la ruta real** en `actions/descuentos-duracion.ts:94,138,167` — la ruta es `/admin/descuentos-duracion`. Pre-existente, no introducido por este cambio. **RESUELTO en v0.20.1** (GGA hook cycle PR 2 / T11) — los 3 sites actualizados.
- [ ] **S2.P.2 edit promocion test failure (pre-existing production bug)** — `tests/promociones-descuentos.spec.ts:147` (`S2.P.2 - edit promocion and verify persistence`) falla consistentemente en aislamiento **incluso con la test-only fix aplicada** (`submitEdit()` + `toHaveText("Guardar cambios")` + nuevo testid `promocion-submit-edit-button` en `promocion-form.tsx:189`).

  **Síntoma**: el form trata el submit como CREATE en vez de UPDATE. Después de clickear edit, cambiar el titulo, y submitar via `submitEdit()`, el titulo viejo sigue en la lista y aparece uno nuevo con el titulo editado (2 items en la lista en vez de 1 reemplazado).

  **Lo que probé (todo falla)**:
  - `submitEdit()` con `data-testid="promocion-submit-edit-button"` distinto del create → sigue creando.
  - `toHaveText("Guardar cambios")` ANTES del click (confirma que el form ESTÁ en edit mode) → assertion pasa, pero el click igual crea.
  - Test aislado sin serial mode → mismo síntoma.

  **Hipótesis más probable**: race condition entre el `useEffect` del form (que resetea valores cuando `editingPromocion?.id` cambia) y el submit. El submit puede capturar `editingPromocion` como null en su closure aunque la UI lo muestre en edit mode.

  **Para retomar**:
  1. **No es fix de test** — el test está bien diseñado (verifica mode + click + resultado). El bug está en el form/manager.
  2. **Production fix sugerido** (out of scope por user mandate, requiere tocar `promocion-form.tsx` + `promocion-manager.tsx`):
     - Agregar un log en `onSubmit` (línea 77 de `promocion-form.tsx`) que imprima `isEditing` y `editingPromocion?.id` al momento del submit. Confirmar si la closure está stale.
     - Considerar forzar re-render del form via `key={editingPromocion?.id ?? 'create'}` en el `<form>` para que remonte cuando cambia el mode.
     - O usar `useRef` para que `onSubmit` lea `editingPromocion` de un ref (no closure).
  3. **Tests acumulados**: una vez fixeado, este test debería pasar sin más cambios. El page object (`submitEdit`) y el testid (`promocion-submit-edit-button`) ya están listos.

  **Estado actual**: 1 commit parcial (test-only) en `fix-e2e-promociones-descuentos` (`c9259b1 test(e2e): fix S2.P.2 edit promocion — add edit-mode testid + submitEdit()`). Falta la parte de producción.

  **Pre-existente**, no introducido por el SDD `descuento-precio-final`. Enmascarado por el AdminLayout strict mode bug (resuelto en `a1b1990`).

- [x] **Admin panel responsive: polish mobile en todas las pages (pc-first → mobile-friendly)** — el admin está diseñado desktop-first y rompe la polish en mobile. **Síntoma más visible**: el `<Button variant="ghost" size="icon">` del hamburguesa en `src/components/admin/admin-sidebar.tsx:240-247` queda flotando "fantasma" arriba a la izquierda (sin posicionamiento, sin header, sin fondo) en vez de tener un header mobile dedicado. **Slice (a) RESUELTO**: el toggle ahora vive adentro de un `<header fixed top-0 inset-x-0 z-40 h-14 bg-background border-b>` con el botón (`aria-label="Abrir menú de navegación"`) + nombre del gym en uppercase. El wrapper redundante `fixed top-4 left-4 z-50` del layout fue removido. **Slice (b) — quick wins RESUELTOS** (commit `504210b`): los 4 issues de mayor impacto del mobile audit — H1+H4 (reveal hover buttons en touch, 2 files), H2 (stack feriado form, 1 file), H3 (stack descuento form, 1 file), M3 (PageHeader truncate, 1 file), M1 (submit bar stack, 2 files). **Slice (b) — cleanup legacy RESUELTO**: el flujo viejo `/admin/rutinas/[id]/dias/[diaId]` (page + API route + 5 components muertos + 2 spec files con tests zombies apuntando a URLs/APIs inexistentes) fue removido (~1005 líneas + 2 dirs vacíos). Los 3 `revalidatePath` en `actions/ejercicios.ts` que apuntaban a la URL vieja ahora apuntan a `/admin/rutinas/${id}` (la URL actual). **Slice (b) — polish PENDIENTE**: M2/M4/M5 + 5 issues low (auditoría completa en commit del audit report) — tablas → cards en mobile, pagination icon-only, batch actions stack, etc. Pendiente para próxima sesión si querés encararlo.

### Lint warnings (160 remaining, 0 errors)
- [ ] **no-unused-vars (118 warnings)** — El más grande (~258 source files). Bulk approach: agregar `argsIgnorePattern: "^_"` y `varsIgnorePattern: "^_"` a `@typescript-eslint/no-unused-vars` en eslint.config.mjs. ⚠️ algunas vars sin prefijo `_` podrían ser bugs reales (imports no usados, variables olvidadas). Hacer grep de `import.*from` sin uso después del cambio.
- [ ] **no-hardcoded-colors (11 warnings)** — Admin plugin rule. Migrar colores CSS hardcodeados a design tokens (`primary`, `secondary`, `muted`, `border`, etc). ⚠️ algunos `hover:` / `focus:` states pueden necesitar tokens nuevos o extenderse via Tailwind config. Contexto: `openspec/ROADMAP.md` § Recomendación BONUS.
- [ ] **no-explicit-any (24 warnings)** — Bajado de error a warning. 4 en producción (react-hook-form `Control<any>`, difícil de tipar), 20 en tests (debug scripts, dejar como están). ⚠️ si se migra a tipos más estrictos, revisar los 4 sitios de producción con prioridad.

### Baja Prioridad
- [ ] Exportación CSV de rutinas
- [ ] i18n (multi-idioma)
- [ ] PWA support (offline PDF access)
- [ ] **GGA pre-commit hook falsos positivos** — el hook revisa el WHOLE file (no solo el diff) y flagea código pre-existente (`console.error`, `as any` casts) que no fue cambiado. Causa `--no-verify` recurrente. Fix: que el hook revise diff-only, o agregar `.gga-ignore` para issues pre-existentes. **RESUELTO en v0.20.1** (GGA hook cycle, Recomendación 4) — wrapper script con diff-only post-filter + `.gga-ignore` escape hatch.
- [ ] **Pre-existing TypeScript errors (13)** — en `rutina-completa-form.tsx`, `pagination.ts`, `check-*.ts`, `promocion-schemas.test.ts`, `use-feriados-notification.test.ts`, `verify-password.ts`. Project-wide, no introducidos por cambios recientes. Cleanup en change aparte. **RESUELTO en v0.20.0** (fix-pre-existing-ts-errors-remove-ignorebuilderrors cycle, 14 errors). + 3 más resueltos en tech debt batch (`tests/gga-diff-filter.test.ts`).
- [ ] **Pre-existing lint issues (460 errors, 730 warnings)** — incluye `as any` en `revalidateTag`, `console.error` en data layer, `z.coerce.number().min(1).min(1000)` chain en `priceSchema`. Cleanup en change aparte. Parcialmente RESUELTO en tech debt batch (GGA-FOLLOWUP-2, 21 `as any` casts en `revalidateTag` removidos, queda el resto).
- [x] **`prisma.feriado.findFirst` duplicate-pre-check outside try/catch** en `actions/feriados.ts:75-82, 155-163`. Pre-existente, fix de admin-panel cleanup. **RESUELTO en v0.20.1** (E2E coverage PR 2 / T12) — wrapped in try/catch.
- [x] **`formData.get("id") as string` cast hides null** en `actions/feriados.ts:110,189,245`. Pre-existente, fix de admin-panel cleanup. **RESUELTO en v0.20.1** (E2E coverage PR 2 / T13) — null-guard agregado (2 sites; el 3ro no existía, ver discovery #190).
- [x] **Hardcoded `gymId: "gym"`** en `actions/promociones.ts:96`, `descuentos-duracion.ts:91`. Identificador del singleton, no un secret. Pre-existente. **RESUELTO en v0.20.1** (E2E coverage PR 2 / T10) — `GYM_SINGLETON_ID` constant introducido en GGA hook cycle PR 1 / T1.
- [ ] **Commit duplicado `cfb79f0`** en este mismo change (pathspec misinterpreted en `git commit -- openspec/ROADMAP.md`). Cosmético, ya compensado por `ce3d7e8`. Limpiar con `git rebase -i 010fd5e` antes del push si querés (v0.18.0 follow-up)
- [ ] **S2.D.4 cache invalidation test issue (descuento-precio-final E2E)** — `tests/promociones-descuentos.spec.ts:277` (`S2.D.4 - descuento list item shows computed Precio final`) falla por un **deadlock de cache**: `getGymPrice()` está cacheado con `cacheTag("gym-config")`, y SOLO la server action `updateGymPrice` (invocada via el form de `GymPriceEditor`) llama `revalidateTag("gym-config")`. Prisma directo (`setGymPrice` en `tests/utils/gym-reset.ts`) y `/api/gym` PATCH (que usa `revalidatePath`) NO invalidan este tag. La UI muestra "Sin precio configurado" cuando el cache es null, y solo permite editar si hay precio → no se puede salir del estado inicial. **Workarounds posibles**: (a) modificar `setGymPrice` para invocar la server action via Playwright `page.request` con Next-Action RPC (complex); (b) aceptar el test como best-effort y validar el cálculo con unit tests + visual check; (c) modificar `GymPriceEditor` para permitir crear precio desde "Sin precio configurado" (UI complexity para test-only). Ver Engram obs #215 para análisis completo. No bloquea producción (el flow real siempre va por la server action). **Pendiente**: SDD cycle chico o fix directo — decisión de scope a tomar en proposal.
- [ ] **S2.D.3 delete descuento + S2.D.4 cache invalidation (SASL/Prisma 7 test env issue)** — Ambos tests fallan en aislamiento y en suite con `Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`. La causa raíz es que el test process (Playwright worker) no carga `.env`, entonces `process.env.DATABASE_URL` llega undefined o malformado a `pg.Pool`.

  **Lo que SÍ funciona** (validado en `fix-e2e-promociones-descuentos`, 6 commits en main):
  - S2.P.1 ✅ — create promocion (era passing antes, sigue ok).
  - S2.P.3 ✅ — clickConfirmDelete funciona (AlertDialog handling correcto).
  - S2.D.1 ✅ — randomMeses + reset utility funcionan (con el adapter Prisma 7 ya aplicado en `e38d13e`).

  **Lo que sigue fallando** (mismo síntoma: "list item not found" en `expectInList`):
  - **S2.D.3** (`tests/promociones-descuentos.spec.ts:258` — `delete descuento`): `await descuentoPage.fillPorcentaje(20); await descuentoPage.submitCreate();` no crea el item. Log muestra `resetDescuentos` fallando con SASL.
  - **S2.D.4** (`tests/promociones-descuentos.spec.ts:277` — `descuento list item shows computed Precio final`): mismo síntoma + `gym-reset.ts` también falla con SASL (mismo problema de `DATABASE_URL`).

  **Para retomar** (orden de investigation):
  1. **Cargar `.env` en el test process**: `playwright.config.ts` no carga `.env` automáticamente (Next.js sí, pero Playwright es un proceso separado). Fix: agregar `import 'dotenv/config'` al `globalSetup` o usar `dotenv-cli`. Verificar que `process.env.DATABASE_URL` esté definida antes de cualquier test.
  2. **Aplicar la misma Prisma 7 fix a `gym-reset.ts`** (línea 32-39): cambiar `new PrismaClient()` a `new PrismaClient({ adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL })) })`. Mismo patrón que `descuentos-reset.ts:32-43` (commit `e38d13e`).
  3. **Una vez SASL resuelto**, S2.D.3 + S2.D.4 deberían pasar (S2.D.1 pasa con randomMeses + reset, confirmando que el reset funciona cuando el client inicializa bien).

  **S2.D.4 cache caveat** (sub-issue): aunque el SASL se arregle, S2.D.4 puede seguir fallando en cold cache por el `cacheTag("gym-config")` que solo `updateGymPrice` invalida. En suite (warm) pasa; en aislamiento (cold) puede fallar. Documentado en Engram obs #215.

  **Pre-existente**, no introducido por `descuento-precio-final`. Enmascarado por el AdminLayout strict mode bug (resuelto en `a1b1990`) y por el bug de Prisma 7 client init en test env.

### Deferred (baja traffic actual)
- [ ] Optimización de rendimiento avanzada (lazy loading, code splitting)

---

## 🆕 Features post-1.0 (v1.1+ candidates)

Funcionalidades nuevas pensadas para después del release 1.0. Cada entrada arranca con su propio SDD cycle (`/sdd-new <feature>`) — la entrada de roadmap captura la idea inicial y las preguntas abiertas a resolver en la fase de proposal.

### Reglas del gym (post-1.0)

El admin configura reglas cortas del gym desde un item nuevo en el sidebar, y los usuarios las ven reflejadas en la página pública `/informacion`. Caso de uso típico: "Mantener la higiene", "Traer toalla", "Respetar los turnos".

**Scope inicial (idea del usuario)**:
- Sidebar admin gana un item "Reglas" (nueva entrada de nav en `admin-sidebar.tsx`).
- Nueva vista admin (o sección dentro de `/admin/config`) con editor para crear / editar / borrar reglas.
- Las reglas se persisten en DB y se invalidan vía `revalidateTag` (mismo patrón que los otros campos de gym config).
- `/informacion` renderiza las reglas en una nueva sección visible para usuarios no autenticados.
- **Constraint fuerte**: reglas concisas. Tope por regla + UI que limite la verbosidad (counter, maxlength, etc).

**Pendiente**: necesita SDD cycle (`/sdd-new reglas-gym`) — proposal + design + tasks + apply + verify + archive.

**Open questions** (a resolver en la fase de proposal):
- [ ] **Storage shape**: ¿nuevo modelo `Rule` (`id`, `gymId`, `position`, `text`, `createdAt`, `updatedAt`) o campo `reglas: string[]` en el modelo `Gym` singleton (similar a `horarioJson`)?
- [ ] **UI admin**: ¿list editor con cards (add / remove), o textarea con una regla por línea (más simple, menos código)?
- [ ] **Reordering**: ¿drag-and-drop como las rutinas, o sin orden definido (orden de creación)?
- [ ] **Cap por regla**: ¿60-80 chars? ¿Y cap total (ej: 10 reglas max)?
- [ ] **Visibilidad por rol**: ¿TRAINER puede ver/editar, o solo ADMIN?
- [ ] **Empty state en `/informacion`**: ¿ocultar la sección si no hay reglas, o mostrar "Sin reglas configuradas"?
- [ ] **Cache tag**: `gym-config` (consistente con otros campos) o tag nuevo `gym-rules`?
- [ ] **Locación del editor**: ¿dentro de `/admin/config` (siguiendo el patrón del `GymConfigManager` actual) o como página aparte `/admin/reglas`?

**Severidad**: Media. Feature de valor para usuarios, no bloquea 1.0.

**Slices estimados**: 1-2 (DB + admin form + public render; los tests E2E se pueden agregar a un slice aparte si el tamaño lo justifica).

### Vaciar campos opcionales de gym config (post-1.0)

Los 4 sub-forms opcionales del admin (`Dirección`, `Mapa` Google Maps embed, `Instagram`, `WhatsApp`) ya aceptan string vacío en el server (Zod schema), pero la UI no expone un atajo para borrarlos — el admin tiene que seleccionar el texto manualmente y guardar. Esta feature agrega un botón claro de "Vaciar" para esos 4 campos.

**Scope inicial (idea del usuario)**:
- 4 sub-forms del `GymConfigManager` ganan un botón de "Vaciar" al lado del "Guardar X" actual.
- El botón aparece solo cuando el campo tiene valor (no cuando ya está vacío).
- Click → limpia el input + requiere "Guardar" explícito posterior (no auto-save).
- Patrón visual: a refinar en SDD (ver recomendación abajo + open questions).

**Recomendación UX propuesta** (a confirmar en SDD):
- Ícono `Trash2` de lucide-react, a la izquierda del "Guardar X" actual.
- Estilo `text-muted-foreground hover:text-destructive` — affordance correcto sin gritar.
- `disabled` cuando el campo ya está vacío (no se puede vaciar lo vacío).
- Sin dialog de confirmación — el "Guardar" posterior ES la confirmación.
- Tooltip `title="Vaciar campo"` para accesibilidad.

**Pendiente**: necesita SDD cycle (`/sdd-new clear-gym-fields`) — proposal + design + tasks + apply + verify + archive.

**Open questions** (a resolver en la fase de proposal):
- [ ] **UX pattern final**: ¿trash icon (recomendado), texto "Limpiar", o "X" adentro del input (clearable input)? Asumir trash icon salvo que se discuta.
- [ ] **Confirmación**: ¿sin dialog (recomendado, "Guardar" es la confirmación), o dialog "Estás seguro?" para los 4 campos?
- [ ] **Aplica también a `nombre`**: NO (es required). El `requiredValue` flag en `FieldConfig` ya excluye al nombre. Confirmar que esto se respeta.
- [ ] **Implementación**: ¿agregar flag `clearable?: boolean` a `FieldConfig` (consistente con el flag `requiredValue` existente), o un componente nuevo?
- [ ] **Server side**: ¿`updateGymField` ya soporta vacío para estos 4? Sí (Zod schema lo permite). El cambio es puramente UI, no toca server actions.
- [ ] **Tests E2E**: ¿agregar test que verifique que el botón "Vaciar" aparece solo con valor, que limpia el input, y que el "Guardar" posterior persiste el vacío? (recomendado: sí, 1 test por sub-form es excesivo — 1 test genérico alcanza).

**Severidad**: Baja-Media. Mejora UX pura, no toca datos ni server.

**Slices estimados**: 1 (toca 1 archivo principal: `GymConfigManager.tsx` + los 4 `FieldConfig`; sin server action ni schema ni migración). Tests: 1 E2E nuevo en `gym-config.spec.ts`.

### Expandir MESES_OPTIONS a todos los meses (post-1.0)

`src/components/admin/descuento-duracion-manager.tsx:35-40` hardcodea `MESES_OPTIONS = [3, 6, 9, 12]`. Los descuentos por duración solo se pueden ofrecer para 3, 6, 9 o 12 meses. Gimnasios que quieran ofrecer descuentos para 1, 2, 4, 5, 7, 8, 10 u 11 meses no pueden. Esta feature expande las opciones a los 12 meses del año, dándole al admin más libertad para configurar su pricing.

**Scope inicial (idea del usuario)**:
- Cambiar `MESES_OPTIONS` de `[3, 6, 9, 12]` a `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]`.
- Verificar que el form sigue validando correctamente (meses > 0, integer).
- Verificar que la página pública `/informacion` sigue renderizando bien la sección de descuentos.
- Actualizar el seed y los tests E2E que dependen del set específico de meses.

**Pendiente**: **implementándose como parte del change `fix-e2e-promociones-descuentos`** (Q1 resolution — el test necesita meses únicos y el form solo permite 4 valores, expandir las opciones resuelve ambos). Se va a mover a ✅ Completado cuando se archive ese change.

**Open questions** (a resolver en la fase de proposal — o ya resueltas si se implementa como parte de fix-e2e):
- [x] **Orden**: ¿ascendente (1-12) o descendente (12-1)? Asumir ascendente (más natural).
- [x] **¿"Todos los meses" como option?**: No, el descuento es per-duración. Cada mes es una opción separada.
- [x] **¿Cambiar el UI a otra cosa?**: Mantener `<select>` por simplicidad (12 valores entran bien en un dropdown).
- [x] **¿Actualizar el seed?**: Sí, el seed en `prisma/seed.ts` debe reflejar los 12 valores (o solo los 4 originales + dejar que el admin agregue el resto).
- [x] **¿Afecta los tests E2E?**: Sí, los tests S2.D.1 y S2.D.4 (en `tests/promociones-descuentos.spec.ts`) usan `meses: 3` que ahora puede colisionar con más options. Resuelto via `beforeEach → resetDescuentos()` + `randomMeses` flag en el fixture.

**Severidad**: Baja-Media. UX improvement, no functional impact. Le da al admin más granularidad en su pricing.

**Slices estimados**: 1 (1 línea de production change + 1 test update). Trivial.

---

## 🎯 Sugerencias para 1.0 prep

> ⚠️ **Sección archiveada en v0.20.1** (las 4 recomendaciones completadas en el bloque 1.0 prep). Los follow-ups descubiertos se movieron a ⏳ Pendiente (Media/Baja según severidad). Ver `openspec/changes/archive/` para los detalles de cada SDD cycle cerrado.

---

## 🐛 Pending fixes accumulating for next patch bump

Tracking de `fix:` commits post-1.0.0. Los `feat:` siguen criterio aparte (minor bump en batches).

**Criterio de bump** (cualquiera de los 3 gatilla patch bump `1.0.0` → `1.0.1`):

- 🔴 **1 hotfix** — bug crítico de producción (data loss, security, crash, funcionalidad core caída)
- 🟡 **2 fixes de severidad media** — bugs de validación, lifecycle, race conditions, UI parcialmente rota
- 🟢 **3 fixes de severidad baja** — polish UX, copy, accesibilidad, refactors menores

**Estado actual**: 1 media + 2 baja → criterio **baja a 1 fix de cerrarse**. Seguimos acumulando.

| # | SHA | Severidad | Descripción |
| --- | --- | --- | --- |
| 1 | `76e160f` | 🟡 Media | `fix(admin): disable save on empty name, prevent double toast on re-mount` — 2 bugs reales (validación + lifecycle) |
| 2 | `75ec9d1` | 🟢 Baja | `fix(admin): replace floating mobile hamburger with proper fixed header bar` — UX polish mobile, sin cambio de lógica |
| 3 | `0628d56` | 🟢 Baja | `chore(lint): remove unused imports and dead code in admin-layout.tsx` — cleanup de código muerto (15 imports/vars/function de un refactor previo) |
| — | ⏳ | 🟡 Media | 1 fix de media más cierra el criterio media |
| — | ⏳ | 🟢 Baja | 1 fix de baja más cierra el criterio baja |
