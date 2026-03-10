# Proposal: Ejercicios en Días de Rutina

## Intent

Permitir que los usuarios vean los ejercicios de cada día de entrenamiento en una página dedicada. Los días de la rutina deben ser clickeables y llevar a una nueva página que muestre el listado de ejercicios de ese día.

**User Need**: El usuario quiere navegar desde la lista de días de una rutina hasta ver el detalle de ejercicios de cada día específico.

## Scope

### In Scope
- Actualizar seed data con ejercicios de ejemplo
- Hacer las cards de días clickeables en `/rutinas/[id]`
- Crear nuevo endpoint API: `GET /api/rutinas/[id]/dias/[diaId]`
- Crear nueva página: `/rutinas/[id]/dias/[diaId]`
- Tests para la nueva funcionalidad

### Out of Scope
- CRUD de ejercicios (crear, editar, eliminar)
- Reordenar ejercicios vía UI
- Agregar más metadata a ejercicios (series, repes, peso)

## Approach

1. **Seed Data**: Agregar ejercicios de ejemplo a cada día en `prisma/seed.ts`
2. **API**: Crear nuevo endpoint que retorne un día específico con sus ejercicios
3. **UI - Detail Page**: Modificar `app/rutinas/[id]/page.tsx` para que las cards de días sean Links
4. **UI - Day Page**: Crear nueva página que muestre los ejercicios del día
5. **Tests**: Agregar tests para la nueva página y funcionalidad

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/seed.ts` | Modified | Agregar ejercicios a cada día |
| `app/rutinas/[id]/page.tsx` | Modified | Hacer day cards clickeables |
| `app/api/rutinas/[id]/dias/[diaId]/route.ts` | NEW | Endpoint para detalle de día |
| `app/rutinas/[id]/dias/[diaId]/page.tsx` | NEW | Página de detalle de día |
| `tests/ejercicios.spec.ts` | NEW | Tests para nueva funcionalidad |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| IDs de seed cambian al hacer reset | Medium | Tests usan IDs dinámicos o se actualizan con el seed |
| Breaking changes en la UI | Low | Mantener estructura de componentes existente |

## Rollback Plan

1. Revertir cambios en `prisma/seed.ts` (quitar ejercicios)
2. Eliminar `app/rutinas/[id]/dias/[diaId]/page.tsx`
3. Eliminar `app/api/rutinas/[id]/dias/[diaId]/route.ts`
4. Revertir cambios en `app/rutinas/[id]/page.tsx` (quitar Links)
5. Regenerar Prisma client y hacer rebuild

## Dependencies

- Ninguna dependencia externa
- Requiere que la base de datos tenga seed ejecutdo (tener datos)

## Success Criteria

- [ ] Las cards de días en `/rutinas/[id]` son clickeables y navegan a `/rutinas/[id]/dias/[diaId]`
- [ ] La página de día muestra todos los ejercicios de ese día
- [ ] El endpoint API retorna la estructura correcta
- [ ] Tests pasan correctamente
- [ ] La navegación de vuelta a la rutina principal funciona
