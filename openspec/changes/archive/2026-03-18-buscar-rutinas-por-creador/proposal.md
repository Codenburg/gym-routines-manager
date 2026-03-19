# Proposal: Buscar rutinas por creador

## Intent

Agregar funcionalidad para filtrar rutinas por el nombre del creador. Actualmente el search solo busca por `nombre` de la rutina, pero los usuarios necesitan encontrar rutinas creadas por usuarios específicos (por ejemplo: "rutinas de Juan", "rutinas del profesor Marcelo").

## Scope

### In Scope
- Backend: Agregar filtro `searchBy` en GET /api/rutinas para buscar por `creador` además de `nombre`
- Frontend: Agregar selector dropdown para elegir tipo de búsqueda (nombre vs creador)
- UX: Mantener compatibilidad hacia atrás (por defecto buscar por nombre)

### Out of Scope
- Búsqueda por múltiples criterios simultáneamente
- Búsqueda fuzzy o por relevancia
- Guardar preferencias de búsqueda del usuario

## Approach

1. **Backend**: Modificar el query parameter `search` para aceptar un parámetro adicional `searchBy` con valores `nombre` (default) o `creador`. Alternativamente, usar OR para buscar en ambos campos cuando no se especifica.
2. **Frontend**: Agregar un Select dropdown (shadcn) al lado del input de búsqueda para elegir el tipo de búsqueda.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/rutinas/route.ts` | Modified | Agregar filtro por `creador` en el where clause |
| `src/components/search/search-bar.tsx` | Modified | Agregar selector dropdown para elegir tipo de búsqueda |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Query performance con ILIKE en ambos campos | Low | El campo `creador` es nullable, usar índice existente o agregar si es necesario |
| Breaking change en API | Low | Mantener backward compatibility, `searchBy` es opcional |

## Rollback Plan

1. Revertir cambios en `src/app/api/rutinas/route.ts` - el query params adicional es opcional
2. Revertir cambios en `src/components/search/search-bar.tsx` - remover el Select y mantener solo el Input
3. No se requiere migración de base de datos

## Dependencies

- Ninguna dependencia externa nueva
- Requiere que el campo `creador` ya existe en el modelo Prisma (✓ confirmado)

## Success Criteria

- [ ] El endpoint GET /api/rutinas?search=Marcelo&searchBy=creador retorna solo rutinas donde creador contiene "Marcelo"
- [ ] El endpoint GET /api/rutinas?search=Pecho retorna rutinas donde nombre contiene "Pecho" (backward compatible)
- [ ] La UI muestra un dropdown para seleccionar "Buscar por nombre" o "Buscar por creador"
- [ ] El comportamiento por defecto es buscar por nombre (mantiene compatibilidad)
