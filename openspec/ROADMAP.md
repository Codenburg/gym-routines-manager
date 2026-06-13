# Roadmap

_Last updated: 2026-06-11_ | _Version: 0.18.0_

---

## ✅ Completado

### Funcionalidades
- [x] Exploración de rutinas por nombre y tipo
- [x] Visualización detallada de rutinas con días y ejercicios
- [x] Login administrador con DNI (Better Auth)
- [x] CRUD completo de rutinas, días y ejercicios
- [x] Ordenamiento drag-and-drop de ejercicios (@dnd-kit)
- [x] Duplicado de rutinas
- [x] Edición de precio de inscripción
- [x] Gestión de feriados (días no laborables)
- [x] Tema claro/oscuro con persistencia
- [x] Notificación badge de feriados nuevos
- [x] Horarios parciales en feriados (hora_inicio, hora_fin)
- [x] Prevención de feriados duplicados (unique date constraint)
- [x] Página de información del gimnasio
- [x] Búsqueda unificada con debounce y URL como source of truth
- [x] Promociones y descuentos por duración (v0.6.0)
- [x] Admin CRUD para promociones y descuentos (v0.6.0)
- [x] Sidebar admin con navegación y drawer mobile (v0.7.0)
- [x] Sidebar footer con user dropdown, theme toggle y logout (v0.8.0)
- [x] Admin panel de promociones refactorizado con acciones atómicas y UI mejorada (v0.10.0)
- [x] Mejora visual en tarjetas de promociones: borde izquierdo verde, jerarquía de título, badge de precio (v0.10.3)
- [x] Mensajes de error en español para validación de precio en formularios Zod (v0.10.4)
- [x] Configuración de gimnasio desde admin: nombre, horarios, dirección, redes sociales (v0.16.0)
- [x] Fallback chain DB → env var → "Gimnasio" genérico para evitar filtrar identidad de cliente (v0.16.0)
- [x] Horario estructurado (formulario por día en vez de free-text) — `horarioJson: Json?` con 7 day cards (Lun a Dom), render app-controlled `"Lun a Vie 8:00 a 22:00 · …"` (v0.17.0)
- [x] Page loading overhaul — `Skeleton` primitive + 11 page-shaped skeletons + 3 route-group `loading.tsx` files (root + public + admin); every page now has a visible loading state (v0.18.0)

### Rendimiento y seguridad
- [x] Notificación de feriados: throttle de 5min en window focus (v0.15.1)
- [x] Home page: caching con unstable_cache + streaming con Suspense (v0.15.1)
- [x] Proxy middleware: fix publicPaths para proteger rutas admin (v0.15.1)
- [x] Dev server: migrado de webpack a Turbopack (v0.15.1)
- [x] Eliminadas queries duplicadas de trainer counts (v0.15.1)
- [x] Fix layout en DescuentoDuracionManager: separación de CreateMode/EditMode previene jump del Select (v0.10.5)
- [x] Sistema de roles ADMIN/TRAINER/USER (v0.13.0)
- [x] Trainer CRUD con soft-delete y aislamiento de rutinas propias (v0.13.0)
- [x] Trainer manager: dialog-based UI para create/edit (v0.14.0)
- [x] Centralized resolveGymName helper con fallback chain (v0.16.0)
- [x] Migración a `unstable_cache` con `cacheTag("gym-config")` + 60s TTL (v0.16.0)
- [x] Zod-validated `HorarioSemanal` shape (horarioDiaSchema + horarioSemanalSchema) con 15 unit tests (v0.17.0)
- [x] Pure `formatHorario` formatter con 10 unit tests, render app-controlled de `/informacion` (v0.17.0)
- [x] `getAdminSession` helper con `React.cache()` dedup para 4 admin pages (v0.18.0)
- [x] 4 cached readers nuevos: `getGymPrice`, `getPromociones`, `getDescuentos`, `getFeriados` con `unstable_cache` + `revalidateTag` (v0.18.0)

### Técnico
- [x] Next.js 16.1.6 + React 19.2.3
- [x] TypeScript strict mode
- [x] Tailwind CSS v4 + shadcn/ui
- [x] Zustand para estado global (theme)
- [x] Zod v4 + React Hook Form para validación
- [x] Prisma ORM con PostgreSQL 18.3
- [x] Server Actions para mutaciones
- [x] Cache invalidation con revalidatePath/revalidateTag
- [x] unstable_cache para rutinas
- [x] Ownership audit trail en base de datos
- [x] User soft delete
- [x] Unit tests con Vitest
- [x] E2E tests con Playwright

### Documentación
- [x] README.md actualizado
- [x] PRD.md con roadmap y fases
- [x] Specs en openspec/

---

## ⏳ Pendiente

### Alta Prioridad
- [ ] Tests E2E con cobertura completa (Playwright) — Fase 4
- [ ] Documentación de API (MDX-based)

### Media Prioridad
- [ ] Generación de PDF por rutina (@react-pdf/renderer)
- [ ] Cache warming cron para SEO
- [x] **Migrar `unstable_cache` → `use cache` (Next 16 Cache Components)** — habilitar `cacheComponents: true` en `next.config.ts` y reescribir TODOS los readers con `'use cache'` + `cacheTag` + `cacheLife`. **También remover los 6 `export const dynamic = "force-dynamic"`** de las admin pages. Verificar que cada server action de mutación llame `revalidateTag` además de `revalidatePath`. **COMPLETED in v0.19.0** — pero con 2 follow-ups nuevos descubiertos:
  - `GGA-FOLLOWUP-2` (Medium): replace `(revalidateTag as any)` casts project-wide con `revalidateTag("tag", "max")` (Next 16 two-arg signature)
  - [x] `GGA-FOLLOWUP-3` (Low): Prisma Decimal serialization en `getGymConfigForServer` para client components. **RESUELTO** commit `5f05a8e` — `getGymConfigForServer` reemplazado por `getGymNameForServer(): Promise<string | null>` (usa `select: { nombre: true }`). Bug venía de `"use cache"` cacheando el return value completo.
- [ ] **Git index corruption recurrente** — `git fsck` reporta missing blobs en `openspec/changes/<new>/*` después de cada cambio nuevo. Workaround actual: `git update-index --force-remove` + re-add. Root cause probable en `.engram/config.json` o interacción con GGA hook. Investigar y resolver de raíz (v0.17.0 follow-up)
- [ ] **E2E test 5.2.3 isolation issue** — `tests/gym-config.spec.ts:5.2.3` falla cuando corre después de 5.2.1 en el mismo suite (5.2.1 muta `gym.nombre` a un test value, 5.2.3 espera "Gimnasio" fallback). Pasa en aislamiento. Fix: `test.describe.configure({ mode: 'serial' })` + reset state en 5.2.3 (v0.17.0 follow-up)
- [ ] **`revalidatePath("/admin/descuentos")` no matchea la ruta real** en `actions/descuentos-duracion.ts:94,138,167` — la ruta es `/admin/descuentos-duracion`. Pre-existente, no introducido por este cambio (v0.18.0 follow-up)

### Baja Prioridad
- [ ] Exportación CSV de rutinas
- [ ] i18n (multi-idioma)
- [ ] PWA support (offline PDF access)
- [ ] Multi-gym support
- [ ] **GGA pre-commit hook falsos positivos** — el hook revisa el WHOLE file (no solo el diff) y flagea código pre-existente (`console.error`, `as any` casts) que no fue cambiado. Causa `--no-verify` recurrente. Fix: que el hook revise diff-only, o agregar `.gga-ignore` para issues pre-existentes (v0.17.0 follow-up)
- [ ] **Pre-existing TypeScript errors (13)** — en `rutina-completa-form.tsx`, `pagination.ts`, `check-*.ts`, `promocion-schemas.test.ts`, `use-feriados-notification.test.ts`, `verify-password.ts`. Project-wide, no introducidos por cambios recientes. Cleanup en change aparte (v0.17.0 follow-up)
- [ ] **Pre-existing lint issues (460 errors, 730 warnings)** — incluye `as any` en `revalidateTag`, `console.error` en data layer, `z.coerce.number().min(1).min(1000)` chain en `priceSchema`. Cleanup en change aparte (v0.17.0 follow-up)
- [ ] **Prisma migration workflow** — el proyecto usa `db push` + `migrate resolve --applied` en vez de `migrate dev` por shadow database issues. Documentar el patrón como estándar del equipo (v0.17.0 follow-up)
- [ ] **`GGA-FOLLOWUP-1`**: `Promise.all` en `src/app/(admin)/admin/page.tsx` sin `try/catch` o `error.tsx` boundary (pre-existente de v0.18.0 Slice 1). Pre-existente, no introducido por cambios recientes. Cleanup en change aparte
- [ ] **`prisma.feriado.findFirst` duplicate-pre-check outside try/catch** en `actions/feriados.ts:75-82, 155-163`. Pre-existente, fix de admin-panel cleanup (v0.18.0 follow-up)
- [ ] **`formData.get("id") as string` cast hides null** en `actions/feriados.ts:110,189,245`. Pre-existente, fix de admin-panel cleanup (v0.18.0 follow-up)
- [ ] **Return-type inconsistency en `actions/feriados.ts`** (`deleteFeriado: Promise<FormState>` vs `createFeriado`/`updateFeriado: Promise<FormState<{ id: string }>>`). Pre-existente (v0.18.0 follow-up)
- [ ] **Hardcoded `gymId: "gym"`** en `actions/promociones.ts:96`, `descuentos-duracion.ts:91`. Identificador del singleton, no un secret. Pre-existente (v0.18.0 follow-up)
- [ ] **Commit duplicado `cfb79f0`** en este mismo change (pathspec misinterpreted en `git commit -- openspec/ROADMAP.md`). Cosmético, ya compensado por `ce3d7e8`. Limpiar con `git rebase -i 010fd5e` antes del push si querés (v0.18.0 follow-up)

### Deferred (baja traffic actual)
- [ ] Optimización de rendimiento avanzada (lazy loading, code splitting)

---

## 🎯 Sugerencias para 1.0 prep

Basado en el audit de los 3 SDD cycles cerrados (`gym-config-admin` v0.16.0, `gym-hours-structured` v0.17.0, `page-loading-overhaul` v0.18.0), estas son las **4 SDD changes recomendadas como bloque de preparación para 1.0.0**. Cada una tiene contexto completo + prompt para el agente que la ejecute.

### Recomendación 1: ~~`1.0-prep: migrate unstable_cache to use cache`~~ ✅ **COMPLETED en v0.19.0**

Habilita `cacheComponents: true` en `next.config.ts` y migra los 11 `unstable_cache` readers a `use cache` + `cacheTag` + `cacheLife`. **También remueve los 6 `export const dynamic = "force-dynamic"`** (anulan el caching). Verifica que cada server action de mutación llame `revalidateTag` además de `revalidatePath`.

**Contexto completo**: `openspec/changes/page-loading-overhaul/proposal.md` § "Tech Debt Inventory" tiene el inventario de los 11 readers, los 6 force-dynamic, y un prompt de contexto paso a paso para el agente del follow-up.

**Severidad**: Alta. Sin esto, la app no usa el caching nativo de Next 16.

**Slices estimados**: 2-3 slices (cambio de flag + migrar 11 readers + remover 6 force-dynamic).

**Status**: ✅ **COMPLETED en v0.19.0**. Slice 1 (7 force-dynamic removals) + Slice 2 (Footer-in-Suspense prerequisite fix + cacheComponents flag enable) + Slice 3 (11 readers migrated to use cache + 5 revalidateTag gaps fixed). Detalles completos en `openspec/changes/archive/2026-06-11-migrate-unstable-cache-to-use-cache/archive-report.md`.

**Follow-ups nuevos descubiertos durante la migración**:
- `GGA-FOLLOWUP-2` (Medium): replace `(revalidateTag as any)` casts project-wide con `revalidateTag("tag", "max")` (Next 16 two-arg signature)
- [x] `GGA-FOLLOWUP-3` (Low): Prisma Decimal serialization en `getGymConfigForServer` para client components. **RESUELTO** commit `5f05a8e` — ver detalles en la sección ⏳ Pendiente.

---

### Recomendación 2: ~~`1.0-prep: fix pre-existing TypeScript errors + remove ignoreBuildErrors`~~ ✅ **COMPLETED in v0.20.0**

Resuelve los 14 errores TypeScript pre-existentes (1 en `src/`, 13 en `tests/`) en archivos no tocados por los cambios recientes (`rutina-completa-form.tsx`, `check-*.ts` debug scripts, `promocion-schemas.test.ts`, `use-feriados-notification.test.ts`, `verify-password.ts`). **Saca `ignoreBuildErrors: true` de `next.config.ts`**.

**Severidad**: Alta. Un proyecto 1.0 no compila con errores + `ignoreBuildErrors` activo es una banda.

**Status**: ✅ **COMPLETED in v0.20.0**. Detalles completos en `openspec/changes/archive/2026-06-12-fix-pre-existing-ts-errors-remove-ignorebuilderrors/archive-report.md`.

**Follow-ups nuevos descubiertos durante el fix**:
- `GGA-FOLLOWUP-4` (Medium): pre-existing E2E flakiness on `5.1.1` y `5.1.4` en `gym-config.spec.ts`. Root cause: `fullyParallel: true` + timing pollution on `saveField` server actions. Fix sugerido: `retries: 1` en Playwright config.
- `GGA-FOLLOWUP-5` (Low): E2E test execution tarda 5-8 minutos en este shell environment. Pre-starting dev server con `pnpm dev` en background funciona.

**Slices estimados**: 1-2 slices (audit + fix + remove flag).

---

### Recomendación 3: `1.0-prep: E2E coverage for critical flows` (Alta Prioridad para 1.0)

Completa la cobertura E2E de los flujos críticos que faltan. Lo que está cubierto: admin flow gym-config (v0.16.0), admin flow horario (v0.17.0), admin flow page-loading (v0.18.0). Lo que falta:
- Rutina CRUD end-to-end (crear, editar, eliminar, asignar días, asignar ejercicios)
- Feriado CRUD completo (v0.16.0 cubre solo el flow gym-config)
- Promociones + Descuentos CRUD end-to-end
- Trainer CRUD end-to-end
- Auth flow completo (login + logout + session expiry)

**Severidad**: Alta. Tests E2E con cobertura completa es un criterio de 1.0.

**Slices estimados**: 2-3 slices (rutinas, feriados+promos+descuentos, trainers+auth).

---

### Recomendación 4: `1.0-prep: GGA pre-commit hook diff-only + fix false positives` (Media Prioridad para 1.0)

El hook actual revisa el WHOLE file y flagea código pre-existente, causando `--no-verify` recurrente. Fix: revisar diff-only, o agregar un mecanismo `.gga-ignore` para issues pre-existentes conocidos. **Limpia también los issues pre-existentes que el hook estaba flageando** (los 6 GGA issues documentados en `archive/2026-06-11-page-loading-overhaul/archive-report.md` + los 8 acumulados de cambios anteriores).

**Severidad**: Media. Quality gate que no funciona bien = falsa sensación de seguridad.

**Slices estimados**: 1-2 slices (audit de los issues + fix del hook).

---

### Recomendación BONUS: cleanup opportunities (No son 1.0 blockers, pero ayudan)

- **Git index corruption recurrente** (Media) — `git fsck` reporta missing blobs después de cada cambio nuevo. Workaround aplicado (`git update-index --force-remove` + re-add). Root cause probable en `.engram/config.json` o interacción con el hook. Investigar y resolver de raíz.
- **`revalidatePath("/admin/descuentos")` mismatch** (Media) en `actions/descuentos-duracion.ts:94,138,167` — la ruta real es `/admin/descuentos-duracion`. Pre-existente, fix de 1 línea.
- **Prisma migration workflow documentation** (Baja) — el proyecto usa `db push` + `migrate resolve --applied` de una forma no estándar. Documentar el patrón o alinear a `migrate dev`.
- **E2E test 5.2.3 isolation issue** (Media) — pre-existente de v0.17.0. Fix: `test.describe.configure({ mode: 'serial' })` + reset state.

---

### Orden recomendado para el 1.0 prep

1. **Recomendación 1** (cacheComponents migration) — habilita caching nativo, es el cambio técnico más importante
2. **Recomendación 2** (TypeScript errors + ignoreBuildErrors) — limpia la banda del build
3. **Recomendación 3** (E2E coverage) — completa la suite de tests
4. **Recomendación 4** (GGA hook) — mejora el quality gate
5. **Cleanup bonus** — se puede hacer en cualquier momento, no bloquea 1.0

Después de los 4 cambios + 1 release bump → **1.0.0 limpio en 4-6 SDD cycles**.
