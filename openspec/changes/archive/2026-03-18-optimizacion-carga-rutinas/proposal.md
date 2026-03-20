# Proposal: Optimización de Carga de Rutinas con Cache y Streaming

## Status
- **Proposed**: 2026-03-18
- **Status**: Completed

## Summary

Optimizar la carga inicial de rutinas implementando cache en servidor con `unstable_cache` y streaming con Suspense + skeleton components, manteniendo el patrón `{ data, error }` existente.

## Problem Statement

### Estado Anterior (Problemático)
- Cada request a la homepage hacía un fetch fresco a `/api/rutinas` → múltiples consultas a la DB
- Loading state era un spinner (DumbbellSpinner) que no reflejaba la estructura visual
- No había cache en servidor, latencia variable según carga de DB
- La página no se renderizaba hasta que todos los datos estaban disponibles

### Impacto en UX
- Primera visita: espera visible hasta que la DB responde
- Páginas posteriores: misma latencia aunque los datos no cambiaron
- Loading spinner no daba feedback de estructura de contenido

## Goals

1. **Cache en servidor**: `unstable_cache` con revalidación de 60s
2. **Streaming**: Suspense envuelve RoutineList, página se renderiza instantáneamente
3. **Skeleton prolijo**: `RoutineListSkeleton` replica estructura visual de cards
4. **Tres estados explícitos**: loading (skeleton), error (mensaje), success (datos)
5. **Sin breaking changes**: mantener patrón `DataResult<T>` existente

## Scope

### In Scope
- Crear `src/lib/rutinas.ts` con `getCachedRutinas()` usando `unstable_cache`
- Crear `src/components/routines/routine-card-skeleton.tsx`
- Actualizar `src/app/page.tsx` para usar función cached
- Mantener manejo de errores con `try/catch` → `{ data, error }`
- Actualizar `src/app/feriados/page.tsx` con skeleton si necesario

### Out of Scope
- Cache en cliente (no usar Zustand/React Query/Jotai para esto)
- Revalidación manual con `revalidatePath`
- Optimización de queries de Prisma (índices, etc.)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Server Component (page.tsx)                                │
│                                                              │
│ getCachedRutinas(search, trainers)                         │
│    │                                                        │
│    ├── unstable_cache (60s)                                │
│    │     └── Prisma query                                  │
│    │                                                        │
│    └── returns DataResult<Rutina[]>                       │
│              { data, error }                                │
│                                                              │
│ <Suspense fallback={<RoutineListSkeleton />}>              │
│   └── <RoutineListWrapper />                              │
│         ├── error=true → "No se pudieron cargar"           │
│         ├── data=[] → "No hay rutinas"                    │
│         └── data=[...] → Cards grid                        │
└─────────────────────────────────────────────────────────────┘
```

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stale data for 60s | Low | Users can refresh; 60s is reasonable for routine list |
| Cache key collisions | Low | Each search/filter combo has separate cache entry |
| Skeleton mismatch | Medium | Skeleton matches card structure exactly |

## Rollback Plan

Si hay problemas:
1. Restaurar `getRutinas()` original en page.tsx (fetch a API)
2. Eliminar `src/lib/rutinas.ts`
3. Volver a `loading.tsx` con spinner

## Dependencies

- Next.js 16 (para `unstable_cache`)
- Ningún paquete adicional

## Success Criteria

1. ✅ Primera carga con DB activa: datos aparecen en <500ms si están en cache
2. ✅ Suspense muestra skeleton inmediatamente (<100ms)
3. ✅ Loading state replica estructura visual de cards
4. ✅ Error state mantiene mensaje claro sin valores inventados
5. ✅ TypeScript compila sin errores
