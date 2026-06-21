# Roadmap

_Last updated: 2026-06-21_ | _Version: 1.0.2_

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
- [ ] Generación de PDF por rutina (@react-pdf/renderer)
- [ ] Cache warming cron para SEO
- [ ] **`GGA-FOLLOWUP-4`** — pre-existing E2E flakiness on `5.1.1` y `5.1.4` en `gym-config.spec.ts`. Root cause: `fullyParallel: true` + timing pollution on `saveField` server actions. Fix sugerido: `retries: 1` en Playwright config. (Descubierto durante Recomendación 2 del 1.0 prep.)
- [ ] **`GGA-FOLLOWUP-5`** — E2E test execution tarda 5-8 minutos en este shell environment. Pre-starting dev server con `pnpm dev` en background funciona. (Descubierto durante Recomendación 2 del 1.0 prep.)
- [ ] **`cleanTestData` partial** — solo `/api/feriados` tiene DELETE; otras APIs usan UI cleanup. (Descubierto durante Recomendación 3 del 1.0 prep.)
- [ ] **3 page-object dead locators** — `FeriadoAdminPage.addButton/errorMessage/deleteByFecha`, `DescuentoAdminPage.maxMesesInput`, `TrainerAdminPage.softDeleteByDni`. Harmless, unused by specs; future cleanup. (Descubierto durante Recomendación 3 del 1.0 prep.)
- [ ] **Git index corruption recurrente** — `git fsck` reporta missing blobs en `openspec/changes/<new>/*` después de cada cambio nuevo. Workaround actual: `git update-index --force-remove` + re-add. Root cause probable en `.engram/config.json` o interacción con GGA hook. Investigar y resolver de raíz (v0.17.0 follow-up)
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

- [ ] **Admin panel responsive — polish mobile pendiente (M2/M4/M5 + 5 issues low)** — el header mobile y los quick wins de la auditoría ya están resueltos (v1.0.0, commits `504210b` + `a1b1990` + `cd2d42c`). Pendiente: tablas → cards en mobile, pagination icon-only, batch actions stack. Audit completo en el commit del audit report.

### Baja Prioridad
- [ ] Exportación CSV de rutinas
- [ ] i18n (multi-idioma)
- [ ] PWA support (offline PDF access)
- [ ] **Pre-existing lint issues (460 errors, 730 warnings)** — incluye `as any` en `revalidateTag`, `console.error` en data layer, `z.coerce.number().min(1).min(1000)` chain en `priceSchema`. Cleanup en change aparte. Parcialmente RESUELTO en tech debt batch (GGA-FOLLOWUP-2, 21 `as any` casts en `revalidateTag` removidos, queda el resto).
- [ ] **Commit duplicado `cfb79f0`** en este mismo change (pathspec misinterpreted en `git commit -- openspec/ROADMAP.md`). Cosmético, ya compensado por `ce3d7e8`. Limpiar con `git rebase -i 010fd5e` antes del push si querés (v0.18.0 follow-up)
- [ ] **Optimización de rendimiento avanzada** (lazy loading, code splitting) — deferred desde §Deferred (1 item, merge con §Baja para reducir noise)

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

---

## 🎯 Sugerencias para 1.0 prep

> ⚠️ **Sección archiveada en v0.20.1** (las 4 recomendaciones completadas en el bloque 1.0 prep). Los follow-ups descubiertos se movieron a ⏳ Pendiente (Media/Baja según severidad). Ver `openspec/changes/archive/` para los detalles de cada SDD cycle cerrado.

---

## 🐛 Pending fixes accumulating for next patch bump

Tracking de `fix:` commits. Cada fix se acumula acá hasta que se cumple un criterio de bump (abajo). Al bumpear, los entries se mueven al `openspec/CHANGELOG.md` y la tabla queda vacía (pending only). Los `feat:` siguen criterio aparte (minor bump en batches).

**Criterio de bump** (cualquiera de los 3 gatilla patch bump `1.0.2` → `1.0.3`):

- 🔴 **1 hotfix** — bug crítico de producción (data loss, security, crash, funcionalidad core caída)
- 🟡 **2 fixes de severidad media** — bugs de validación, lifecycle, race conditions, UI parcialmente rota
- 🟢 **3 fixes de severidad baja** — polish UX, copy, accesibilidad, refactors menores

**Estado actual**: Tabla vacía. Esperando el primer `fix:` del próximo ciclo. Los fixes que justificaron los bumps v1.0.1 + v1.0.2 viven en `openspec/CHANGELOG.md` (convención: ROADMAP es pending only, CHANGELOG es el audit trail).

| # | SHA | Severidad | Descripción |
| --- | --- | --- | --- |
| — | — | — | _Sin fixes acumulados._ |
