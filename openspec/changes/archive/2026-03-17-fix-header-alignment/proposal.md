# Proposal: Fix Header Alignment

## Summary

Corregir la desalineación del header cambiando la clase `items-start` por `items-center` en el contenedor flex de búsqueda y navegación.

## Intent

- **Type**: bugfix
- **Priority**: low
- **Estimate impact**: negligible (1 line change)

## Problem Statement

El contenedor flex en la línea 72 de `src/app/page.tsx` usa `items-start`, lo que causa desalineación vertical entre el SearchBar y los botones de navegación cuando está en layout responsive (sm: en adelante).

## Proposed Approach

Cambiar una clase Tailwind de `items-start` a `items-center` en el elemento flex container.

### Changes

| File | Line | Change |
|------|------|--------|
| `src/app/page.tsx` | 72 | `items-start` → `items-center` |

### Rollback Plan

Si el cambio causa efectos visuales no deseados, revertir el cambio es trivial (1 línea).

## Affected Modules

- `src/app/page.tsx` - Home page

## Risks

- **Risk**: Muy bajo - cambio visual mínimo
- **Mitigation**: Verificación manual rápida
