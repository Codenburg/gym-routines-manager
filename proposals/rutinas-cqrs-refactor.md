# Proposal: Rutinas Data Flow Refactor — Strict CQRS Separation

## 1. Intent

### Problem Statement

The current architecture has a **hybrid data flow** where:
- Server Components read directly from actions (`getRutinas()` in `actions/rutinas.ts`)
- Actions use `revalidatePath` instead of `revalidateTag`
- Client components use `router.refresh()` for data sync

This creates **two sources of truth**:
1. `getRutinas()` in actions (uncached, direct Prisma)
2. `getCachedRutinas()` in lib (cached with `unstable_cache`)

The admin page uses the uncached version while the homepage uses the cached version. Mutations call `revalidatePath` instead of `revalidateTag`, so cache invalidation is incomplete.

### Solution

Enforce **strict CQRS separation**:
- **Query Layer** (`src/lib/rutinas.ts`): All reads via `unstable_cache` — single source of truth
- **Command Layer** (`src/app/actions/rutinas.ts`): All mutations via direct Prisma + `revalidateTag("rutinas")` only
- **Client Components**: Remove `router.refresh()`, rely on cache invalidation

## 2. Scope

### In Scope (Query Layer — `src/lib/rutinas.ts`)

| Function | Responsibility | Cache |
|----------|---------------|-------|
| `getCachedRutinas()` | List rutinas with filters | `unstable_cache`, tag `["rutinas"]` |
| `getCachedRutinaById()` | Single rutina detail | `unstable_cache`, tag `["rutinas"]` |

**Discovery needed**: Verify no other files bypass these functions for reads.

### In Scope (Command Layer — `src/app/actions/rutinas.ts`)

| Action | Responsibility |
|--------|---------------|
| `createRutina` | Create rutina → Prisma direct → `revalidateTag("rutinas")` |
| `updateRutina` | Update rutina → Prisma direct → `revalidateTag("rutinas")` |
| `duplicateRutina` | Duplicate rutina → Prisma direct → `revalidateTag("rutinas")` |
| `deleteRutina` | Delete rutina → Prisma direct → `revalidateTag("rutinas")` |
| `deleteRutinas` | Bulk delete → Prisma direct → `revalidateTag("rutinas")` |
| `createRutinaCompleta` | Create with dias/ejercicios → Prisma direct → `revalidateTag("rutinas")` |

**Remove from actions**:
- `getRutinas()` (lines 396-431) — MOVED to lib
- `getRutina()` (lines 436-470) — MOVED to lib

**Remove from mutations**:
- All `revalidatePath()` calls

### In Scope (Client Components)

Files to modify:
- `src/components/admin/rutinas-list-client.tsx` — remove `router.refresh()` at lines 124, 178, 252

### Out of Scope

- API routes (`src/app/api/rutinas/`) — separate discussion needed
- Zustand store (`src/store/rutinas-store.ts`) — uses API routes, not Prisma direct

## 3. Approach

### Phase 1: Migrate Query Functions to Lib

**Current state in `src/lib/rutinas.ts`:**
```typescript
// Already exists with correct caching:
export async function getCachedRutinas(search?: string, trainers?: string) {
  return unstable_cache(
    () => fetchRutinasFromDb(search, trainers),
    ["rutinas", search ?? "", trainers ?? ""],
    { revalidate: 60, tags: [RUTINAS_CACHE_TAG] }
  )();
}

export async function getCachedRutinaById(id: string): Promise<RutinaDetail | null> {
  return unstable_cache(
    () => fetchRutinaById(id),
    ["rutina", id],
    { revalidate: 60, tags: [RUTINAS_CACHE_TAG] }
  )();
}
```

**Action required**: Export aliases for backward compatibility:
```typescript
export const getRutinas = getCachedRutinas;
export const getRutina = getCachedRutinaById;
```

### Phase 2: Remove Query Functions from Actions

**Delete from `src/app/actions/rutinas.ts`:**
- `getRutinas()` function (lines 396-431)
- `getRutina()` function (lines 436-470)

**Import from lib instead** (for any internal action use):
```typescript
import { getRutina } from "@/lib/rutinas";
```

### Phase 3: Fix Mutation Actions

**Current (WRONG):**
```typescript
// In every mutation action:
await revalidateRutinasCache();
revalidatePath("/admin/dashboard");
revalidatePath("/admin/rutinas");
```

**Correct:**
```typescript
// Only this in every mutation action:
const { revalidateTag } = await import("next/cache");
revalidateTag("rutinas");
```

Remove:
- All `revalidatePath()` calls
- Import of `revalidateRutinasCache`

### Phase 4: Clean Client Components

**Current in `rutinas-list-client.tsx`:**
```typescript
// In handleDuplicate (line 124):
router.refresh();

// In handleDelete (line 178):
router.refresh();

// In handleBatchDelete (line 252):
router.refresh();
```

**Correct:**
```typescript
// Remove router.refresh() entirely
// The revalidateTag("rutinas") in actions will invalidate the cache
// Server Components will re-render with fresh data on next navigation
```

Keep:
- Local state cleanup (e.g., `setRowSelection({})` after delete)
- Toast notifications for user feedback

### Phase 5: Update Server Components

**`src/app/(admin)/admin/rutinas/page.tsx`:**
```typescript
// BEFORE:
import { getRutinas } from "@/app/actions/rutinas";
const rutinas = await getRutinas();

// AFTER:
import { getRutinas } from "@/lib/rutinas";
const rutinas = await getRutinas();
```

**`src/app/(admin)/admin/rutinas/[id]/page.tsx`:**
```typescript
// BEFORE:
import { getRutina } from "@/app/actions/rutinas";
const rutina = await getRutina(id);

// AFTER:
import { getRutina } from "@/lib/rutinas";
const rutina = await getRutina(id);
```

## 4. Corrected Invariants

```
❌ Ninguna lectura de rutinas fuera de getRutinas() / getCachedRutinas()
❌ Ningún revalidatePath en flujo de rutinas
❌ Ningún router.refresh() para sincronización de datos
✅ Mutations usan Prisma directo + revalidateTag("rutinas")
✅ Un único tag global: "rutinas"
✅ getRutinas/getCachedRutinas es la única fuente de lectura y está cacheada
```

## 5. Risk

### **Risk Level: HIGH**

**Reason**: A single component bypassing `getRutinas()` breaks system coherence. The hybrid state reappears if:
1. Any Server Component imports `getRutinas` from actions instead of lib
2. Any component uses direct Prisma access for reads
3. Any client component uses `router.refresh()` to "solve" stale data

**Mitigation**: Code review and grep audit before declaring completion.

### Discovery Checklist (files to verify)

| File | Check For | Expected |
|------|-----------|----------|
| `src/app/(admin)/admin/rutinas/page.tsx` | Import from actions | Should import from lib |
| `src/app/(admin)/admin/rutinas/[id]/page.tsx` | Import from actions | Should import from lib |
| `src/app/(admin)/admin/page.tsx` | Any Prisma/rutinas reads | Should use lib |
| `src/app/(public)/page.tsx` | Uses `getCachedRutinas` | Correct - already uses lib |
| `src/app/(public)/rutinas/[id]/page.tsx` | Uses `getCachedRutinaById` | Correct - already uses lib |
| `src/app/api/rutinas/**/*.ts` | Direct Prisma | OUT OF SCOPE - separate discussion |
| `src/store/rutinas-store.ts` | Prisma direct | OUT OF SCOPE - uses API routes |
| `src/components/admin/rutinas-list-client.tsx` | `router.refresh()` | Should be removed |

## 6. Success Condition

The system is **ONLY consistent** if BOTH conditions hold:

1. **ALL views read from `getRutinas()` / `getCachedRutinas()`** (Server Components using lib)
2. **ALL mutations invalidate `"rutinas"` via `revalidateTag`**

If either fails:
- Condition 1 fails → Some views get stale data from uncached queries
- Condition 2 fails → Cache never invalidates, views show stale data after mutations

**Hybrid state reappears** when a component bypasses the cache layer.

## 7. Summary of Changes

| File | Change |
|------|--------|
| `src/lib/rutinas.ts` | Add `getRutinas` and `getRutina` aliases pointing to cached versions |
| `src/app/actions/rutinas.ts` | Remove `getRutinas`, `getRutina`; replace `revalidatePath` with `revalidateTag` |
| `src/app/(admin)/admin/rutinas/page.tsx` | Import `getRutinas` from lib |
| `src/app/(admin)/admin/rutinas/[id]/page.tsx` | Import `getRutina` from lib |
| `src/components/admin/rutinas-list-client.tsx` | Remove `router.refresh()` calls |

## 8. Open Questions

1. **API Routes**: The `/api/rutinas` routes use direct Prisma and serve the Zustand store. Do we need to also route these through the query layer, or is the store considered a separate bounded context?
