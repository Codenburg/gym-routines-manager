# Changelog

Todos los cambios significativos del proyecto se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

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
