# Changelog

Todos los cambios significativos del proyecto se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

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
