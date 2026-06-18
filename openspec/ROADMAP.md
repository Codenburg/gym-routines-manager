# Roadmap

_Last updated: 2026-06-18_ | _Version: 1.0.1_

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
- [x] GGA-FOLLOWUP-1 (`Promise.all` en `src/app/(admin)/admin/page.tsx` sin `try/catch` o `error.tsx` boundary. Pre-existente de v0.18.0 Slice 1). **RESUELTO** en commit `8300e2d` (tech debt cleanup batch) — wrap con try/catch + ErrorState fallback.
- [x] GGA-FOLLOWUP-7 (Prisma migration workflow documentation, Baja). **RESUELTO** en commit `8300e2d` — documentado en `CONTRIBUTING.md` §"Workflow de migraciones (no estándar)".
- [x] GGA-FOLLOWUP-13 (Return-type inconsistency en `actions/feriados.ts` — `deleteFeriado: Promise<FormState>` vs `createFeriado`/`updateFeriado: Promise<FormState<{ id: string }>>`). **RESUELTO** en commit `8300e2d` — unificado a `Promise<FormState<{ id: string }>>`, caller type inference (no annotation).
- [x] **Migrar `unstable_cache` → `use cache` (Next 16 Cache Components)** — habilitar `cacheComponents: true` en `next.config.ts` y reescribir TODOS los readers con `'use cache'` + `cacheTag` + `cacheLife`. **También remover los 6 `export const dynamic = "force-dynamic"`** de las admin pages. Verificar que cada server action de mutación llame `revalidateTag` además de `revalidatePath`. **COMPLETED in v0.19.0** — pero con 2 follow-ups nuevos descubiertos:
  - `GGA-FOLLOWUP-2` (Medium): replace `(revalidateTag as any)` casts project-wide con `revalidateTag("tag", "max")` (Next 16 two-arg signature)
  - [x] `GGA-FOLLOWUP-3` (Low): Prisma Decimal serialization en `getGymConfigForServer` para client components. **RESUELTO** commit `5f05a8e` — `getGymConfigForServer` reemplazado por `getGymNameForServer(): Promise<string | null>` (usa `select: { nombre: true }`). Bug venía de `"use cache"` cacheando el return value completo.
- [ ] **Git index corruption recurrente** — `git fsck` reporta missing blobs en `openspec/changes/<new>/*` después de cada cambio nuevo. Workaround actual: `git update-index --force-remove` + re-add. Root cause probable en `.engram/config.json` o interacción con GGA hook. Investigar y resolver de raíz (v0.17.0 follow-up)
- [x] **E2E test 5.2.3 isolation issue** — `tests/gym-config.spec.ts:5.2.3` falla cuando corre después de 5.2.1 en el mismo suite. **RESUELTO en v0.20.1** — `test.describe.configure({ mode: 'serial' })` + file-level `test.afterEach(resetGymConfig)` con `tests/utils/gym-reset.ts` (direct prisma access, scoped + JSDoc'd). Ver Recomendación 3.
- [x] **`revalidatePath("/admin/descuentos")` no matchea la ruta real** en `actions/descuentos-duracion.ts:94,138,167` — la ruta es `/admin/descuentos-duracion`. Pre-existente, no introducido por este cambio. **RESUELTO en v0.20.1** (GGA hook cycle PR 2 / T11) — los 3 sites actualizados.

- [x] **Admin panel responsive: polish mobile en todas las pages (pc-first → mobile-friendly)** — el admin está diseñado desktop-first y rompe la polish en mobile. **Síntoma más visible**: el `<Button variant="ghost" size="icon">` del hamburguesa en `src/components/admin/admin-sidebar.tsx:240-247` queda flotando "fantasma" arriba a la izquierda (sin posicionamiento, sin header, sin fondo) en vez de tener un header mobile dedicado. **Slice (a) RESUELTO**: el toggle ahora vive adentro de un `<header fixed top-0 inset-x-0 z-40 h-14 bg-background border-b>` con el botón (`aria-label="Abrir menú de navegación"`) + nombre del gym en uppercase. El wrapper redundante `fixed top-4 left-4 z-50` del layout fue removido. **Slice (b) PENDIENTE**: audit responsive del resto de las pages admin (rutinas CRUD, feriados, promociones, descuentos, trainers, config) — tablas anchas, grids multi-columna, forms side-by-side probablemente asumen viewport desktop. Pendiente de próximo ciclo si querés encararlo.

### Lint warnings (160 remaining, 0 errors)
- [ ] **no-unused-vars (118 warnings)** — El más grande (~258 source files). Bulk approach: agregar `argsIgnorePattern: "^_"` y `varsIgnorePattern: "^_"` a `@typescript-eslint/no-unused-vars` en eslint.config.mjs. ⚠️ algunas vars sin prefijo `_` podrían ser bugs reales (imports no usados, variables olvidadas). Hacer grep de `import.*from` sin uso después del cambio.
- [ ] **no-hardcoded-colors (11 warnings)** — Admin plugin rule. Migrar colores CSS hardcodeados a design tokens (`primary`, `secondary`, `muted`, `border`, etc). ⚠️ algunos `hover:` / `focus:` states pueden necesitar tokens nuevos o extenderse via Tailwind config. Contexto: `openspec/ROADMAP.md` § Recomendación BONUS.
- [ ] **no-explicit-any (24 warnings)** — Bajado de error a warning. 4 en producción (react-hook-form `Control<any>`, difícil de tipar), 20 en tests (debug scripts, dejar como están). ⚠️ si se migra a tipos más estrictos, revisar los 4 sitios de producción con prioridad.

### Baja Prioridad
- [ ] Exportación CSV de rutinas
- [ ] i18n (multi-idioma)
- [ ] PWA support (offline PDF access)
- [ ] Multi-gym support
- [ ] **GGA pre-commit hook falsos positivos** — el hook revisa el WHOLE file (no solo el diff) y flagea código pre-existente (`console.error`, `as any` casts) que no fue cambiado. Causa `--no-verify` recurrente. Fix: que el hook revise diff-only, o agregar `.gga-ignore` para issues pre-existentes. **RESUELTO en v0.20.1** (GGA hook cycle, Recomendación 4) — wrapper script con diff-only post-filter + `.gga-ignore` escape hatch.
- [ ] **Pre-existing TypeScript errors (13)** — en `rutina-completa-form.tsx`, `pagination.ts`, `check-*.ts`, `promocion-schemas.test.ts`, `use-feriados-notification.test.ts`, `verify-password.ts`. Project-wide, no introducidos por cambios recientes. Cleanup en change aparte. **RESUELTO en v0.20.0** (fix-pre-existing-ts-errors-remove-ignorebuilderrors cycle, 14 errors). + 3 más resueltos en tech debt batch (`tests/gga-diff-filter.test.ts`).
- [ ] **Pre-existing lint issues (460 errors, 730 warnings)** — incluye `as any` en `revalidateTag`, `console.error` en data layer, `z.coerce.number().min(1).min(1000)` chain en `priceSchema`. Cleanup en change aparte. Parcialmente RESUELTO en tech debt batch (GGA-FOLLOWUP-2, 21 `as any` casts en `revalidateTag` removidos, queda el resto).
- [ ] **Prisma migration workflow** — el proyecto usa `db push` + `migrate resolve --applied` en vez de `migrate dev` por shadow database issues. Documentar el patrón como estándar del equipo. **RESUELTO** en tech debt batch (GGA-FOLLOWUP-7) — documentado en `CONTRIBUTING.md` §"Workflow de migraciones (no estándar)".
- [x] **`GGA-FOLLOWUP-1`**: `Promise.all` en `src/app/(admin)/admin/page.tsx` sin `try/catch` o `error.tsx` boundary (pre-existente de v0.18.0 Slice 1). Pre-existente, no introducido por cambios recientes. Cleanup en change aparte. **RESUELTO en tech debt batch (commit `8300e2d`)**.
- [x] **`prisma.feriado.findFirst` duplicate-pre-check outside try/catch** en `actions/feriados.ts:75-82, 155-163`. Pre-existente, fix de admin-panel cleanup. **RESUELTO en v0.20.1** (E2E coverage PR 2 / T12) — wrapped in try/catch.
- [x] **`formData.get("id") as string` cast hides null** en `actions/feriados.ts:110,189,245`. Pre-existente, fix de admin-panel cleanup. **RESUELTO en v0.20.1** (E2E coverage PR 2 / T13) — null-guard agregado (2 sites; el 3ro no existía, ver discovery #190).
- [x] **Return-type inconsistency en `actions/feriados.ts`** (`deleteFeriado: Promise<FormState>` vs `createFeriado`/`updateFeriado: Promise<FormState<{ id: string }>>`). Pre-existente. **RESUELTO en tech debt batch (commit `8300e2d`)** — unificado a `Promise<FormState<{ id: string }>>`.
- [x] **Hardcoded `gymId: "gym"`** en `actions/promociones.ts:96`, `descuentos-duracion.ts:91`. Identificador del singleton, no un secret. Pre-existente. **RESUELTO en v0.20.1** (E2E coverage PR 2 / T10) — `GYM_SINGLETON_ID` constant introducido en GGA hook cycle PR 1 / T1.
- [ ] **Commit duplicado `cfb79f0`** en este mismo change (pathspec misinterpreted en `git commit -- openspec/ROADMAP.md`). Cosmético, ya compensado por `ce3d7e8`. Limpiar con `git rebase -i 010fd5e` antes del push si querés (v0.18.0 follow-up)

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

### Mostrar precio descontado en admin y público (post-1.0)

Hoy los `DescuentoDuracion` muestran solo el porcentaje (`{descuento.porcentaje}%`), tanto en el admin (`descuento-duracion-manager.tsx:357-358`) como en la página pública `/informacion` (`DurationDiscountsSection.tsx:60-61`). El usuario no ve el cálculo real ni en el panel ni en la página de info. La idea es mostrar el **precio final descontado** junto al %, tomando como base el `Gym.price` singleton (ya disponible vía `getGymPrice()` con cache tag `gym-config`).

**Ejemplo concreto**: gym base = $50.000, descuento configurado = 10% sobre 3 meses → el admin ve "Descuento del 10% · Precio final $45.000" y el usuario en `/informacion` ve la misma fila con el cálculo hecho.

**Scope inicial (idea del usuario)**:
- La fila de cada descuento (admin + público) gana un campo con el **precio final** = `gym.price * (1 - porcentaje/100)`, redondeado según estrategia a definir en SDD.
- El admin puede ver de un vistazo cuánto queda cada descuento en plata, sin hacer la cuenta mental.
- El usuario en `/informacion` ve exactamente el mismo número que ve el admin (consistencia), con el % explícito para entender el cálculo.
- Si `gym.price` es `null` (precio base no configurado), la sección sigue mostrando los % pero oculta el cálculo (no se rompe nada).
- Reutilizar `formatPriceARS()` que ya existe (lo usa `PlansSection.tsx:47`).
- Sin schema change, sin migración, sin nuevo modelo — el cálculo es puro sobre datos existentes.

**Recomendación UX propuesta** (a confirmar en SDD):
- **Admin**: agregar un segundo renglón al item (`descuento-duracion-manager.tsx:351-361`) bajo "Descuento del X%" → "Precio final: **$45.000**" en `text-foreground font-medium` con el precio base tachado al lado en `text-muted-foreground line-through` tipo ecommerce.
- **Público**: agregar una 3ª columna "Precio final" a la tabla en `DurationDiscountsSection.tsx` (alined right, misma prominencia que "Descuento"), o un chip al lado del % según cómo se vea mejor en mobile.
- Formato: `De $50.000 a $45.000` (strikethrough + nuevo), o `$45.000 (-10%)` — a resolver en design phase.

**Pendiente**: necesita SDD cycle (`/sdd-new descuento-precio-final`) — proposal + design + tasks + apply + verify + archive.

**Open questions** (a resolver en la fase de proposal):
- [ ] **UX pattern del cálculo**: ¿strikethrough del precio base + precio final prominente (estilo ecommerce), o flecha "$50.000 → $45.000", o columnas separadas (Duración / % / Precio final), o chip "$45.000 (-10%)"? Asumir strikethrough + precio prominente salvo que se discuta.
- [ ] **Precio base faltante**: si `gym.price === null`, ¿ocultar la columna del cálculo, mostrar el % solo, o bloquear la creación del descuento hasta que haya precio base? Asumir ocultar la columna / cálculo (no rompe nada).
- [ ] **Round strategy**: ¿`Math.round` (estándar), `Math.floor` (favorece al gym), o redondear a múltiplos de $100/$1000 para prolijidad visual? Hoy los precios son `int()` en ARS.
- [ ] **Cache invalidation cross-tag**: cuando cambia `gym.price` (tag `gym-config`), ¿revalidar también `descuentos-duracion` para que el cálculo se refresque? Hoy son tags separados. Viceversa: cuando cambia un descuento, ¿revalidar `gym-config`? Probablemente no necesario (un descuento nuevo no invalida el precio base), pero confirmar.
- [ ] **Live preview en admin**: ¿el admin ve el cálculo actualizarse en vivo al escribir `porcentaje` en el form (con watch de react-hook-form), o solo después de guardar? Asumir live preview — es lo que el usuario espera de un form.
- [ ] **Scope de la feature**: ¿aplica SOLO a `DescuentoDuracion`, o también a `Promocion`? Hoy `promocion.precio` es absoluto (no usa % sobre base), así que no aplica. Confirmar scope acotado.
- [ ] **Reutilización de `formatPriceARS()`**: ya existe y lo usa `PlansSection.tsx`. ¿Es la utility correcta, o crear `formatPrecioConDescuento(base, porcentaje)` para encapsular el cálculo + format juntos?

**Severidad**: Media-Alta. Hoy el admin tiene que hacer la cuenta a mano para saber cuánto le queda cada combo de meses; el usuario público ve solo el % sin ancla concreta. Mejora UX importante, no toca DB ni server actions.

**Slices estimados**: 1 (toca 2 componentes — `descuento-duracion-manager.tsx` y `DurationDiscountsSection.tsx` — + pasa `getGymPrice()` como prop desde sus pages server-side; sin schema, sin migración, sin nueva server action). Tests: 1 unit test del cálculo puro + 1 E2E nuevo en `gym-config.spec.ts` o `descuentos.spec.ts` que verifique el cálculo con gym price fijo.

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

### Recomendación 3: ~~`1.0-prep: E2E coverage for critical flows`~~ ✅ **COMPLETED en v0.20.1**

Completa la cobertura E2E de los flujos críticos que faltan. Lo que está cubierto: admin flow gym-config (v0.16.0), admin flow horario (v0.17.0), admin flow page-loading (v0.18.0). Lo que falta:
- Rutina CRUD end-to-end (crear, editar, eliminar, asignar días, asignar ejercicios)
- Feriado CRUD completo (v0.16.0 cubre solo el flow gym-config)
- Promociones + Descuentos CRUD end-to-end
- Trainer CRUD end-to-end
- Auth flow completo (login + logout + session expiry)

**Severidad**: Alta. Tests E2E con cobertura completa es un criterio de 1.0.

**Slices estimados**: 2-3 slices (rutinas, feriados+promos+descuentos, trainers+auth).

**Status (2026-06-15)**: SDD cycle `e2e-coverage-critical-flows` **COMPLETED en v0.20.1** — 4 stacked-to-main PRs landed + 4 docs commits + 1 sdd-tasks mark-done (16 commits on main). Verify PASS (engram #215): 151/151 vitest, tsc clean (0 new errors), Playwright list 245 tests in 18 files, deferred full E2E run documented. Archive report: `openspec/changes/archive/2026-06-13-e2e-coverage-critical-flows/archive-report.md`. All 4 PRs applied with pre-acked `size:exception` (PR 1: 2.1×, PR 3: 1.44×, PR 4: 1.83× the 500-line review budget). 30+ new test cases (rutinas S1.1-S1.5, feriados S2.1.1-S2.6.1, promociones S2.P.1-S2.P.3, descuentos S2.D.1-S2.D.3, trainers S3.T.1-S3.T.4, auth S3.A.1-S3.A.5). 8 discoveries honored (engram #200, #206, #209, #210, #211, #213, #214, #215). Includes 3 collateral fixes: GGA-FOLLOWUP-4 (retries: 1), 5.2.3 isolation (serial mode + gym-reset prisma util), test:fast script (5-8 min shell execution).

**Follow-ups nuevos descubiertos durante el ciclo**:
- `cleanTestData` is partial (only `/api/feriados` has DELETE; other APIs use UI cleanup) — future work
- 3 page-object dead locators (`FeriadoAdminPage.addButton/errorMessage/deleteByFecha`, `DescuentoAdminPage.maxMesesInput`, `TrainerAdminPage.softDeleteByDni`) — harmless, unused by specs; future cleanup
- Git index corruption on `openspec/changes/<new>/*` (recurrent from previous cycles; root cause not fixed)

---

### Recomendación 4: ~~`1.0-prep: GGA pre-commit hook diff-only + fix false positives`~~ ✅ **COMPLETED en v0.20.1**

El hook actual revisa el WHOLE file y flagea código pre-existente, causando `--no-verify` recurrente. Fix: revisar diff-only, o agregar un mecanismo `.gga-ignore` para issues pre-existentes conocidos. **Limpia también los issues pre-existentes que el hook estaba flageando** (los 6 GGA issues documentados en `archive/2026-06-11-page-loading-overhaul/archive-report.md` + los 8 acumulados de cambios anteriores).

**Severidad**: Media. Quality gate que no funciona bien = falsa sensación de seguridad.

**Slices estimados**: 1-2 slices (audit de los issues + fix del hook).

**Status (2026-06-13)**: SDD cycle `gga-hook-diff-only` **COMPLETED en v0.20.1**. 3 stacked-to-main PRs landed (PR 1 Tooling T1–T9 con `size:exception`, PR 2 Cleanups T10–T13, PR 3 Seed+Docs+Release T14–T16) + 3 docs commits. Verify PASS (151/151 tests, 0 new TS errors, 6/6 discoveries honored, 4/4 cleanups verificados en source, 11/11 `.gga-ignore` entries parsean). Detalles completos en `openspec/changes/archive/2026-06-13-gga-hook-diff-only/archive-report.md`. El wrapper es opt-in — cada dev debe correr `bash scripts/install-gga-hook.sh` una vez por fresh clone.

---

### Recomendación BONUS: cleanup opportunities (No son 1.0 blockers, pero ayudan)

- **Git index corruption recurrente** (Media) — `git fsck` reporta missing blobs después de cada cambio nuevo. Workaround aplicado (`git update-index --force-remove` + re-add). Root cause probable en `.engram/config.json` o interacción con el hook. Investigar y resolver de raíz.
- **`revalidatePath("/admin/descuentos")` mismatch** (Media) en `actions/descuentos-duracion.ts:94,138,167` — la ruta real es `/admin/descuentos-duracion`. Pre-existente, fix de 1 línea.
- **Prisma migration workflow documentation** (Baja) — el proyecto usa `db push` + `migrate resolve --applied` de una forma no estándar. Documentar el patrón o alinear a `migrate dev`.
- **E2E test 5.2.3 isolation issue** (Media) — pre-existente de v0.17.0. **RESUELTO en v0.20.1** vía Recomendación 3 (T3.4).

---

### Orden recomendado para el 1.0 prep

1. **Recomendación 1** (cacheComponents migration) — habilita caching nativo, es el cambio técnico más importante. ✅ v0.19.0
2. **Recomendación 2** (TypeScript errors + ignoreBuildErrors) — limpia la banda del build. ✅ v0.20.0
3. **Recomendación 3** (E2E coverage) — completa la suite de tests. ✅ v0.20.1
4. **Recomendación 4** (GGA hook) — mejora el quality gate. ✅ v0.20.1
5. **Cleanup bonus** — se puede hacer en cualquier momento, no bloquea 1.0

**🎉 1.0 prep COMPLETO (4/4 recomendaciones delivered).** Pendiente: release bump a 1.0.0 + cleanup opcional de los follow-ups nuevos (GGA-FOLLOWUP-2, dead locators, etc.).

---

## 🐛 Pending fixes accumulating for next patch bump

Tracking de `fix:` commits post-1.0.0. Los `feat:` siguen criterio aparte (minor bump en batches).

**Criterio de bump** (cualquiera de los 3 gatilla patch bump `1.0.0` → `1.0.1`):

- 🔴 **1 hotfix** — bug crítico de producción (data loss, security, crash, funcionalidad core caída)
- 🟡 **2 fixes de severidad media** — bugs de validación, lifecycle, race conditions, UI parcialmente rota
- 🟢 **3 fixes de severidad baja** — polish UX, copy, accesibilidad, refactors menores

**Estado actual**: 1 media + 1 baja → **ningún criterio cumplido todavía**, seguimos acumulando.

| # | SHA | Severidad | Descripción |
| --- | --- | --- | --- |
| 1 | `76e160f` | 🟡 Media | `fix(admin): disable save on empty name, prevent double toast on re-mount` — 2 bugs reales (validación + lifecycle) |
| 2 | `75ec9d1` | 🟢 Baja | `fix(admin): replace floating mobile hamburger with proper fixed header bar` — UX polish mobile, sin cambio de lógica |
| — | ⏳ | 🟡 Media | 1 fix de media más cierra el criterio media |
| — | ⏳ | 🟢 Baja | 2 fixes de baja más cierran el criterio baja |
