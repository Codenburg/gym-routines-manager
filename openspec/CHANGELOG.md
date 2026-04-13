# Changelog

Todos los cambios significativos del proyecto se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

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
