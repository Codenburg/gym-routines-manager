# Proposal: Metadata de Series y Repeticiones en Ejercicios

## Intent

Agregar metadata de series y repeticiones a cada ejercicio. Por ejemplo: "3x12 - 1x10" indica 3 series de 12 repeticiones más 1 serie de 10 repeticiones.

**User Need**: El usuario quiere ver cuántas series y repeticiones hacer de cada ejercicio.

## Scope

### In Scope
- Agregar campos `series` y `repes` al modelo `Ejercicio` en Prisma
- Actualizar seed data con valores de series/repes
- Actualizar API endpoints para devolver los nuevos campos
- Actualizar UI para mostrar la metadata

### Out of Scope
- Agregar pesos (kg/lbs)
- Editar metadata desde UI
- Validación de valores

## Approach

1. **Schema**: Modificar `prisma/schema.prisma` para agregar campos opcionales
2. **Migration**: Crear migration de Prisma
3. **Seed**: Actualizar con valores ejemplo
4. **API**: Actualizar respuestas para incluir nuevos campos
5. **UI**: Mostrar "3x12 - 1x10" en las páginas

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Agregar series, repes |
| `prisma/migrations` | NEW | Migration para nuevos campos |
| `prisma/seed.ts` | Modified | Agregar valores ejemplo |
| `app/api/rutinas/[id]/route.ts` | Modified | Incluir nuevos campos |
| `app/api/rutinas/[id]/dias/[diaId]/route.ts` | Modified | Incluir nuevos campos |
| `app/rutinas/[id]/page.tsx` | Modified | Mostrar metadata |
| `app/rutinas/[id]/dias/[diaId]/page.tsx` | Modified | Mostrar metadata |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migration afecta datos existentes | Low | Los campos son opcionales (nullable) |
| IDs cambian al regenerar | Low | Regenerar seed si es necesario |

## Rollback Plan

1. Revertir cambios en schema.prisma
2. Revertir migration
3. Regenerar Prisma client
4. Rebuild

## Dependencies

- Ninguna dependencia externa

## Success Criteria

- [ ] Schema tiene campos series y repes
- [ ] Seed tiene valores ejemplo
- [ ] API devuelve los nuevos campos
- [ ] UI muestra "3x12 - 1x10" formato
- [ ] Tests pasan
