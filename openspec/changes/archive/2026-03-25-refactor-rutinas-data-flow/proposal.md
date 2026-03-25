# Proposal: refactor-rutinas-data-flow

## Intent

Unify the rutinas data flow under a single cache strategy: `unstable_cache` with tag `revalidateTag("rutinas")`. Currently the system has a hybrid approach where:
- Homepage uses `getCachedRutinas()` with `unstable_cache` + tags
- Admin uses `getRutinas()` with direct Prisma (bypasses cache)
- Mutations call BOTH `revalidateTag` AND `revalidatePath`
- Client components use `router.refresh()` as escape hatch

This creates inconsistent cache behavior, redundant invalidation calls, and potential data desync. The refactor establishes one canonical read path (`getCachedRutinas` from `src/lib/rutinas.ts`) consumed by both homepage and admin, with mutations strictly using `revalidateTag("rutinas")` and no client-side `router.refresh()`.

## Scope

### In Scope
- Refactor `getRutinas()` in `src/lib/rutinas.ts` to serve admin with stable cache key `["rutinas"]`
- Replace direct Prisma calls in `src/app/actions/rutinas.ts:getRutinas()` with `getCachedRutinas()`
- Remove all `revalidatePath()` calls from rutinas mutations
- Remove `router.refresh()` from `rutinas-list-client.tsx` and `rutinas-list.tsx` (if exists)
- Remove `revalidateRutinasCache()` helper, inline `revalidateTag` calls in mutations

### Out of Scope
- Changing `getCachedRutinaById()` (individual rutina detail caching)
- Modifying trainer filter logic
- Changes to other data flows (ejercicios, días, etc.)
- Performance optimization of the cache itself

## Approach

### Step 1: Refactor `src/lib/rutinas.ts`

**Current** (lines 210-218):
```typescript
export async function getCachedRutinas(search?: string, trainers?: string) {
  return unstable_cache(
    () => fetchRutinasFromDb(search, trainers),
    ["rutinas", search ?? "", trainers ?? ""],
    {
      revalidate: 60,
      tags: [RUTINAS_CACHE_TAG],
    }
  )();
}
```

**Change**: Rename to `getRutinas()` and use stable key `["rutinas"]`:
```typescript
export async function getRutinas(search?: string, trainers?: string) {
  return unstable_cache(
    () => fetchRutinasFromDb(search, trainers),
    ["rutinas"],
    {
      revalidate: 3600,
      tags: [RUTINAS_CACHE_TAG],
    }
  )();
}
```

**Rationale**: Stable key ensures admin and homepage share the same cache entry. `revalidate: 3600` (1 hour) as safety net; primary invalidation is via `revalidateTag`.

**Note**: Keep `getCachedRutinas` as alias for backwards compatibility during transition:
```typescript
export const getCachedRutinas = getRutinas;
```

### Step 2: Update `src/app/actions/rutinas.ts`

**Current** (lines 396-431):
```typescript
export async function getRutinas() {
  try {
    const rutinas = await prisma.rutina.findMany({
      select: { ... },
      orderBy: { createdAt: "desc" },
    });
    return rutinas.map((rutina) => ({
      ...rutina,
      diasCount: rutina.dias.length,
    }));
  } catch (error) {
    console.error("Error fetching rutinas:", error);
    return [];
  }
}
```

**Change**: Replace with call to lib:
```typescript
export async function getRutinas() {
  try {
    const result = await getRutinasFromLib();
    return result.rutinas;
  } catch (error) {
    console.error("Error fetching rutinas:", error);
    return [];
  }
}

async function getRutinasFromLib() {
  const { getRutinas } = await import("@/lib/rutinas");
  return getRutinas();
}
```

**Note**: The lib returns `{ rutinas, trainers }` but admin only needs `rutinas`. The direct Prisma `getRutinas()` in actions returns a different shape (`createdAt`, `updatedAt`, full `dias` array). Verify if admin actually needs `createdAt`/`updatedAt` or if current lib shape is sufficient.

### Step 3: Clean Up Mutations in `src/app/actions/rutinas.ts`

**Files affected**: `createRutina` (line 94-97), `updateRutina` (line 165-169), `duplicateRutina` (line 272-275), `deleteRutina` (line 320-324), `deleteRutinas` (line 374-378), `createRutinaCompleta` (line 643-647)

**Current pattern**:
```typescript
await revalidateRutinasCache();  // revalidateTag
revalidatePath("/admin/dashboard");
revalidatePath("/admin/rutinas");
```

**Change**: Remove ALL `revalidatePath` calls:
```typescript
const { revalidateTag } = await import("next/cache");
revalidateTag("rutinas");
```

**Also**: Remove `revalidateRutinasCache()` import (line 7), remove `revalidatePath` import (line 3).

### Step 4: Clean Up Client Components

**File**: `src/components/admin/rutinas-list-client.tsx`

**Changes**:
1. Line 124: Remove `router.refresh()` after `duplicateRutina` success
2. Line 178: Remove `router.refresh()` after `deleteRutina` success
3. Line 214: Remove `const router = useRouter();`
4. Line 252: Remove `router.refresh()` after `deleteRutinas` success

**Rationale**: `revalidateTag` in mutations triggers Next.js cache revalidation automatically. Server Components will reflect changes on next render without explicit refresh.

**Alternative for state sync**: Keep local state cleanup (`setRowSelection({})` on line 251) but remove `router.refresh()`.

### Step 5: Check for `rutinas-list.tsx` (Server Component)

If exists, verify it fetches via `getRutinas()` and does not call `revalidatePath` after mutations.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/rutinas.ts` | Modified | Stable cache key, export unified function |
| `src/app/actions/rutinas.ts` | Modified | Remove direct Prisma, remove revalidatePath |
| `src/components/admin/rutinas-list-client.tsx` | Modified | Remove router.refresh() calls |
| `src/app/admin/rutinas/page.tsx` | Verify | Check if uses getRutinas() from actions correctly |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Admin page loses `createdAt`/`updatedAt` fields | Medium | Verify admin component actually needs these; if so, extend lib to include |
| Cache key collision causing stale data | Low | Use stable `["rutinas"]` key; `revalidateTag` bypasses key |
| `router.refresh()` removal causes UI lag | Low | `revalidateTag` triggers instant Next.js cache clear; Server Component re-renders on next access |
| Bulk delete performance regression | Low | `revalidateTag` handles bulk invalidation same as `revalidatePath` |

## Rollback Plan

1. **Revert `src/lib/rutinas.ts`**: Restore `getCachedRutinas` with per-filter cache keys
2. **Revert `src/app/actions/rutinas.ts`**: Restore direct Prisma `getRutinas()`
3. **Revert mutations**: Restore `revalidatePath()` calls alongside `revalidateTag`
4. **Revert client**: Restore `router.refresh()` calls

All changes are isolated to specific files; rollback requires no database migration.

## Dependencies

- Next.js 16 with `unstable_cache` and `revalidateTag` support
- Existing `revalidateRutinasCache()` helper (to be removed)

## Success Criteria

- [ ] Admin page renders rutinas using same `getRutinas()` from `src/lib/rutinas.ts`
- [ ] Homepage renders rutinas using same `getRutinas()` from `src/lib/rutinas.ts`
- [ ] No `revalidatePath()` calls remain in `src/app/actions/rutinas.ts`
- [ ] No `router.refresh()` calls remain in `rutinas-list-client.tsx`
- [ ] Mutations call only `revalidateTag("rutinas")`
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Admin and homepage both reflect mutation changes on next navigation
