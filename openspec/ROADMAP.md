# Roadmap

_Last updated: 2026-06-24_ | _Version: 1.1.0_

> Per docs-guardian v1.2 convention: ROADMAP is **pending-only**. Completed releases live in [`openspec/CHANGELOG.md`](./CHANGELOG.md) as the audit trail (not duplicated here).

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

- [ ] Documentación de API (MDX-based)

### Media Prioridad
- [ ] **Reglas del gym** — el admin configura reglas cortas del gym desde un item nuevo en el sidebar, los usuarios las ven en `/informacion`. Storage: nuevo modelo `Rule` o campo `reglas: string[]` en `Gym` (a resolver en proposal). UI: list editor con cards o textarea. Constraint: cap por regla (60-80 chars), counter, maxlength. Pendiente: SDD cycle `/sdd-new reglas-gym`. (Movido desde §Features post-1.0 por el user 2026-06-21.)
- [ ] Generación de PDF por rutina (@react-pdf/renderer)
- [ ] Cache warming cron para SEO
- [ ] **E2E flakiness on `gym-config.spec.ts:5.1.1/5.1.4`** — pre-existing flakiness. Root cause: `fullyParallel: true` + timing pollution on `saveField` server actions. Fix sugerido: `retries: 1` en Playwright config. (Descubierto durante Recomendación 2 del 1.0 prep.)
- [ ] **E2E test execution slow in shell environment** — E2E tests tardan 5-8 minutos en este shell environment. Pre-starting dev server con `pnpm dev` en background funciona. (Descubierto durante Recomendación 2 del 1.0 prep.)
- [ ] **`cleanTestData` partial** — solo `/api/feriados` tiene DELETE; otras APIs usan UI cleanup. (Descubierto durante Recomendación 3 del 1.0 prep.)
- [ ] **3 page-object dead locators** — `FeriadoAdminPage.addButton/errorMessage/deleteByFecha`, `DescuentoAdminPage.maxMesesInput`, `TrainerAdminPage.softDeleteByDni`. Harmless, unused by specs; future cleanup. (Descubierto durante Recomendación 3 del 1.0 prep.)
- [ ] **Git index corruption recurrente** — `git fsck` reporta missing blobs en `openspec/changes/<new>/*` después de cada cambio nuevo. Workaround actual: `git update-index --force-remove` + re-add. Root cause probable en `.engram/config.json` o interacción con GGA hook. Investigar y resolver de raíz (v0.17.0 follow-up)

- [ ] **Admin panel responsive — polish mobile pendiente (M2/M4/M5 + 5 issues low)** — el header mobile y los quick wins de la auditoría ya están resueltos (v1.0.0, commits `504210b` + `a1b1990` + `cd2d42c`). Pendiente: tablas → cards en mobile, pagination icon-only, batch actions stack. Audit completo en el commit del audit report.
- [ ] **E2E test para pause/resume del progress bar del undo toast** — el fix de `src/components/ui/ToastWithProgress.tsx` (commit `dff9616`) se validó manualmente con mouse real, pero no hay test automatizado. El problema: `page.mouse.move` de Playwright no dispara `onMouseEnter` de React consistentemente en portales de sonner. Workaround para el futuro test: usar `dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}))` en el elemento del toast en vez de `mouse.move`. El fix en sí está validado y funciona — el test es nice-to-have, no bloqueante.

### Baja Prioridad
- [ ] Exportación CSV de rutinas
- [ ] i18n (multi-idioma)
- [ ] PWA support (offline PDF access)
- [ ] **Pre-existing lint issues (460 errors, 730 warnings)** — incluye `as any` en `revalidateTag`, `console.error` en data layer, `z.coerce.number().min(1).min(1000)` chain en `priceSchema`. Cleanup en change aparte. Parcialmente RESUELTO en tech debt batch (GGA-FOLLOWUP-2, 21 `as any` casts en `revalidateTag` removidos, queda el resto).
- [ ] **Optimización de rendimiento avanzada** (lazy loading, code splitting) — deferred desde §Deferred (1 item, merge con §Baja para reducir noise)

---

## 🐛 Pending fixes accumulating for next patch bump

Tracking de `fix:` commits. Cada fix se acumula acá hasta que se cumple un criterio de bump (abajo). Al bumpear, los entries se mueven al `openspec/CHANGELOG.md` y la tabla queda vacía (pending only). Los `feat:` siguen criterio aparte (minor bump en batches).

**Criterio de bump** (cualquiera de los 3 gatilla patch bump `1.0.3` → `1.0.4`):

- 🔴 **1 hotfix** — bug crítico de producción (data loss, security, crash, funcionalidad core caída)
- 🟡 **2 fixes de severidad media** — bugs de validación, lifecycle, race conditions, UI parcialmente rota
- 🟢 **3 fixes de severidad baja** — polish UX, copy, accesibilidad, refactors menores

**Estado actual**: Tabla vacía. Esperando el primer `fix:` del próximo ciclo. Los fixes que justificaron los bumps v1.0.2 + v1.0.3 viven en `openspec/CHANGELOG.md` (convención: ROADMAP es pending only, CHANGELOG es el audit trail).

| # | SHA | Severidad | Descripción |
| --- | --- | --- | --- |
| 1 | `a9e2c64` | 🟡 | `fix(search):` reset page=1 al aplicar filtros — user en page 2 con filtro veía lista vacía (page no se reseteaba al cambiar filter). User-validated repro 2026-06-23. |
