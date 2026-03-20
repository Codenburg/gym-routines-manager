# Proposal: Invalidación de Cache para Rutinas

## Intent

El sistema ya posee cache en servidor con `unstable_cache` y tags para `getRutinas`, pero NO existe un mecanismo de invalidación explícita después de mutaciones. Currently, after create/update/delete operations, the UI continues showing stale data until the 60-second revalidate timeout expires. This introduces temporal inconsistencies that are unacceptable for a production system.

**Problem**: The data layer has cache with tag-based invalidation infrastructure, but the mutation actions never trigger it.

## Scope

### In Scope
- Connect `revalidateRutinasCache()` to all mutation actions in `rutinas.ts`
- Connect `revalidateRutinasCache()` to all mutation actions in `dias.ts` (since days affect rutinas list with `diasCount`)
- Verify no duplicate invalidation logic exists
- Ensure separation: data layer owns cache, actions trigger invalidation

### Out of Scope
- Modifying the cache infrastructure itself (it's already correct)
- Adding cache to other entities (feriados, gym info)
- Changing the 60-second revalidate as fallback (keeps it as safety net)

## Approach

The infrastructure already exists in `src/lib/rutinas.ts`:
- `getCachedRutinas` uses `unstable_cache` with `tags: ["rutinas"]`
- `revalidateRutinasCache()` uses `revalidateTag("rutinas")` 

**Fix**: Import and call `revalidateRutinasCache()` in all mutation actions AFTER the database operation succeeds.

### Actions to modify in `rutinas.ts`:
| Action | Modification |
|--------|-------------|
| `createRutina` | Add `await revalidateRutinasCache()` after `prisma.rutina.create` |
| `updateRutina` | Add `await revalidateRutinasCache()` after `prisma.rutina.update` |
| `deleteRutina` | Add `await revalidateRutinasCache()` after `prisma.rutina.delete` |
| `createRutinaCompleta` | Add `await revalidateRutinasCache()` after transaction |

### Actions to modify in `dias.ts`:
| Action | Modification |
|--------|-------------|
| `createDia` | Add `await revalidateRutinasCache()` after `prisma.dia.create` |
| `updateDia` | Add `await revalidateRutinasCache()` after `prisma.dia.update` |
| `deleteDia` | Add `await revalidateRutinasCache()` after `prisma.dia.delete` |
| `reorderDias` | Add `await revalidateRutinasCache()` after transaction |

**Rationale for dias.ts**: The `getCachedRutinas` function includes `diasCount` in its response. Any modification to days (create, update, delete, reorder) changes this count, so the rutinas cache must be invalidated.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/actions/rutinas.ts` | Modified | Add `revalidateRutinasCache()` calls to 4 actions |
| `src/app/actions/dias.ts` | Modified | Add `revalidateRutinasCache()` calls to 4 actions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Forgetting to call revalidate in future actions | Medium | Document that ALL rutinas mutations MUST call `revalidateRutinasCache()` |
| Race condition if mutation fails after DB commit | Low | Keep `revalidatePath` calls as backup; `revalidateTag` is fire-and-forget |

## Rollback Plan

If issues arise, simply remove the `await revalidateRutinasCache()` calls from the modified files. The cache will fallback to time-based revalidation (60 seconds).

## Dependencies

- `src/lib/rutinas.ts` with `revalidateRutinasCache()` function (already exists)

## Success Criteria

- [ ] After `createRutina`, the homepage immediately shows the new routine
- [ ] After `updateRutina`, changes appear immediately on homepage
- [ ] After `deleteRutina`, removed routine disappears immediately
- [ ] After any `dia` mutation, `diasCount` is accurate on homepage
- [ ] TypeScript and ESLint pass
- [ ] No duplicate invalidation logic (single `revalidateRutinasCache()` function)
