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
- [ ] **Migrar `unstable_cache` → `use cache` (Next 16 Cache Components)** — habilitar `cacheComponents: true` en `next.config.ts` y reescribir TODOS los readers (`getGymConfigForServer`, `getGymDisplayForServer`, `getRoutinesPaginated`, `getTrainerCounts`, `getRutinas`, `getCachedRutinaById`, `getStats`, `getGymPrice`, `getPromociones`, `getDescuentos`, `getFeriados`) con `'use cache'` + `cacheTag` + `cacheLife`. **También remover los 6 `export const dynamic = "force-dynamic"`** de las admin pages (dashboard, rutinas list, rutinas/[id] edit, rutinas/[id]/dias/[diaId] edit, feriados, config) — esos flags anulan el caching, son deuda técnica del mismo cambio. Verificar que cada server action de mutación (`actions/rutinas.ts`, `actions/feriados.ts`, `actions/promociones.ts`, `actions/descuentos-duracion.ts`, `actions/gym.ts`) llame `revalidateTag` además de `revalidatePath` para mantener la freshness post-write. **Prompt de contexto completo en `openspec/changes/page-loading-overhaul/proposal.md` § "Tech Debt Inventory"** (v0.18.0 follow-up)
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
- [ ] **`prisma.feriado.findFirst` duplicate-pre-check outside try/catch** en `actions/feriados.ts:75-82, 155-163`. Pre-existente, fix de admin-panel cleanup (v0.18.0 follow-up)
- [ ] **`formData.get("id") as string` cast hides null** en `actions/feriados.ts:110,189,245`. Pre-existente, fix de admin-panel cleanup (v0.18.0 follow-up)
- [ ] **Return-type inconsistency en `actions/feriados.ts`** (`deleteFeriado: Promise<FormState>` vs `createFeriado`/`updateFeriado: Promise<FormState<{ id: string }>>`). Pre-existente (v0.18.0 follow-up)
- [ ] **Hardcoded `gymId: "gym"`** en `actions/promociones.ts:96`, `descuentos-duracion.ts:91`. Identificador del singleton, no un secret. Pre-existente (v0.18.0 follow-up)
- [ ] **Commit duplicado `cfb79f0`** en este mismo change (pathspec misinterpreted en `git commit -- openspec/ROADMAP.md`). Cosmético, ya compensado por `ce3d7e8`. Limpiar con `git rebase -i 010fd5e` antes del push si querés (v0.18.0 follow-up)

### Baja Prioridad
- [ ] Exportación CSV de rutinas
- [ ] i18n (multi-idioma)
- [ ] PWA support (offline PDF access)
- [ ] Multi-gym support

### Deferred (baja traffic actual)
- [ ] Optimización de rendimiento avanzada (lazy loading, code splitting)
