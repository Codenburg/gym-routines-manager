# Proposal: Error Handling with Graceful Degradation

## Status
- **Proposed**: 2026-03-18
- **Status**: Completed

## Summary

Implementar un sistema robusto de manejo de errores en la capa de datos que utilice el patrón `{ data, error }` para eliminar la ambigüedad entre "no hay datos" y "hubo un error". La UI debe ser completamente honesta y mostrar estados explícitos sin valores inventados.

## Problem Statement

### Estado Anterior (Problemático)
- La capa de datos usaba `throw` para errores de infraestructura (DB caída, fallos de red)
- Error boundaries (`error.tsx`) capturaban errores de infraestructura mezclados con bugs reales
- No había diferenciación entre "no hay datos" y "error de DB"
- Valores fallback inventados (ej: `$45.000` como "aproximado") mentían al usuario
- Sidebar y contenido principal podían mostrar estados contradictorios

### Situación Específica Detectada
Cuando la base de datos fallaba:
- Contenido principal: "No se pudieron cargar las rutinas" (error state correcto)
- Sidebar: "Todos: 30", "Leo: 10" (counts simulados, incorrectos)

## Goals

1. **Graceful Degradation**: Errores de infraestructura NO lanzan excepciones
2. **Unambiguous State**: `DataResult<T>` con `{ data, error }` elimina ambigüedad
3. **Honest UI**: Sin valores inventados o "aproximados"
4. **Single Source of Truth**: Un estado controla toda la UI
5. **Error Boundaries Reserved**: `error.tsx` solo para bugs, no infraestructura

## Scope

### In Scope
- Implementación de `DataResult<T>` en `src/lib/data-result.ts`
- Refactorización de todas las funciones de data fetching para usar `try/catch` + `err()`
- Adaptación de UI para manejar tres estados: loading, error, success
- Unificación del estado entre sidebar y contenido principal
- Eliminación de todos los valores fallback inventados

### Out of Scope
- Cambios en el schema de base de datos
- Implementación de retry logic automático
- Rate limiting o circuit breakers

## Affected Modules

| Module | Files | Impact |
|--------|-------|--------|
| `src/lib` | `data-result.ts` | Nuevo - tipo `DataResult<T>` |
| `src/app/page.tsx` | Homepage | Refactorizado con `extractTrainers()` |
| `src/app/feriados/page.tsx` | Feriados | Refactorizado con `DataResult` |
| `src/app/informacion/page.tsx` | Información | Refactorizado - precio muestra "No disponible" |
| `src/app/rutinas/[id]/page.tsx` | Detalle rutina | Eliminado `throw`, usa `DataResult` |
| `src/app/rutinas/[id]/dias/[diaId]/page.tsx` | Detalle día | Eliminado `throw`, usa `DataResult` |
| `src/app/admin/page.tsx` | Admin dashboard | Refactorizado con `DataResult` |
| `src/components/routines/routine-list.tsx` | Lista rutinas | Nuevo prop `showError` |
| `src/components/search/trainer-sidebar-client.tsx` | Sidebar | Refactorizado con `hasError` |
| `src/components/admin/GymPriceEditor.tsx` | Editor precio | Maneja `null` (no más fallback) |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes en componentes que usan data fetching | Medium | TypeScript strict mode catching issues |
| Inconsistencia entre páginas no refactorizadas | Low | Solo páginas públicas/admin usan este patrón |

## Rollback Plan

Si hay problemas críticos, se puede revertir:
1. Restaurar `getRutinas()` y `getTrainers()` a versión anterior con `throw`
2. Restaurar valores fallback en componentes
3. Nota: El tipo `DataResult<T>` es additive, no breaking

## Dependencies

- Ninguna dependencia externa nueva
- Usa Prisma existente para data fetching
- No requiere migraciones

## Success Criteria

1. ✅ Cuando DB falla, NO se muestran counts simulados en sidebar
2. ✅ Cuando DB falla, contenido muestra "No disponible" sin valores inventados
3. ✅ `error.tsx` permanece como safety net para bugs reales
4. ✅ TypeScript compila sin errores
5. ✅ Todas las páginas usan el mismo patrón `DataResult<T>`
