# Technical Design: Multi-Select Rutinas

## Status

**Phase**: Design  
**Change**: multi-select-rutinas  
**Last Updated**: 2026-03-20

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (rutinas-list-client.tsx)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  State:                                                                     │
│  ┌─────────────────────┐                                                    │
│  │ selectedIds: Set<string>  │◄─── useState<Set<string>>(new Set())        │
│  └─────────────────────┘                                                    │
│                                                                             │
│  UI Flow:                                                                    │
│  ┌──────────┐    ┌────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │ Checkbox │───►│toggleSelect │───►│ Bulk Delete Btn │───►│ window.confirm│ │
│  │ Column   │    │             │    │ (visible if >0) │    │             │ │
│  └──────────┘    └─────────────┘    └─────────────────┘    └──────┬──────┘ │
│                                                                     │        │
│                                                                     ▼        │
│                                                          ┌─────────────────┐ │
│                                                          │ toast.promise() │ │
│                                                          │  (sonner v2)    │ │
│                                                          └────────┬────────┘ │
│                                                                   │        │
└----------------------------------------------------------------───┼────────┘
                                                                    │
┌───────────────────────────────────────────────────────────────────┼────────┐
│                              SERVER                                │        │
├───────────────────────────────────────────────────────────────────┼────────┤
│                                                                   ▼        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     deleteRutinas Server Action                      │  │
│  │                    (src/app/actions/rutinas.ts)                      │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  1. Verify admin auth                                                │  │
│  │  2. Parse `ids` from FormData (JSON string array)                    │  │
│  │  3. Validate: isArray(ids) && ids.length > 0                          │  │
│  │  4. Execute: prisma.rutina.deleteMany({ where: { id: { in: ids } }}) │  │
│  │     ▲▲▲ CRITICAL: SINGLE QUERY — NO forEach/delete individual ▲▲▲    │  │
│  │  5. revalidateRutinasCache() + revalidatePath()                      │  │
│  │  6. Return: { success: true, data: { deletedCount: number } }        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌────────────────────┐         ┌────────────────────┐                     │
│  │   Prisma Client    │         │   Next.js Cache   │                     │
│  │  (src/lib/prisma.ts)│         │   (revalidatePath) │                     │
│  └────────────────────┘         └────────────────────┘                     │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Changes

### 1. File: `src/components/admin/rutinas-list-client.tsx`

**Current State (lines 1-165)**:
- Client component with `useState` for `searchTerm` and `isDuplicating`
- Table rendering filtered rutinas
- Actions: duplicate, edit (Link), delete (DeleteRutinaButton)

**Changes Required**:

#### 1.1 Add Selection State

```typescript
// After existing useState declarations (after line 27)
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// Selection helper functions
const toggleSelection = (id: string) => {
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};

const selectAll = () => setSelectedIds(new Set(rutinas.map((r) => r.id)));
const deselectAll = () => setSelectedIds(new Set());
const isAllSelected = selectedIds.size === rutinas.length && rutinas.length > 0;
const isSelected = (id: string) => selectedIds.has(id);
```

#### 1.2 Add Bulk Delete Handler

```typescript
// After handleDuplicate function (after line 55)
const handleBulkDelete = async () => {
  if (!window.confirm(`¿Eliminar ${selectedIds.size} rutinas?\nEsta acción no se puede deshacer.`)) {
    return;
  }

  const formData = new FormData();
  formData.set("ids", JSON.stringify([...selectedIds]));

  toast.promise(deleteRutinas({ success: false }, formData), {
    loading: "Eliminando rutinas...",
    success: (data) => {
      setSelectedIds(new Set());
      router.refresh();
      return `${data.deletedCount} rutinas eliminadas`;
    },
    error: (err) => err.message || "Error al eliminar rutinas",
  });
};
```

#### 1.3 Import Required Modules

```typescript
// Add to existing imports (line 3-10)
import { useRef } from "react";
import { deleteRutinas } from "@/app/actions/rutinas";
```

#### 1.4 Add Checkbox Column to Table Header

```typescript
// In <thead> <tr> (around line 84)
<th className="w-12 px-6 py-4">
  <Checkbox
    checked={isAllSelected ? true : selectedIds.size > 0 ? "indeterminate" : false}
    onCheckedChange={(checked) => {
      if (checked === true) selectAll();
      else deselectAll();
    }}
    aria-label="Seleccionar todas"
  />
</th>
```

#### 1.5 Add Checkbox to Each Table Row

```typescript
// In <tbody> <tr> (around line 95) — first <td>
<td className="w-12 px-6 py-4">
  <Checkbox
    checked={isSelected(rutina.id)}
    onCheckedChange={() => toggleSelection(rutina.id)}
    aria-label={`Seleccionar ${rutina.nombre}`}
  />
</td>
```

#### 1.6 Add Bulk Delete Button

```typescript
// After search input div (around line 77) — add before table
{selectedIds.size > 0 && (
  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
    <span className="text-sm text-destructive font-medium">
      {selectedIds.size} seleccionada{selectedIds.size !== 1 ? "s" : ""}
    </span>
    <button
      type="button"
      onClick={handleBulkDelete}
      className="ml-auto px-3 py-1.5 bg-destructive text-destructive-foreground text-sm font-medium rounded-md hover:bg-destructive/90 transition-colors"
    >
      Eliminar seleccionadas
    </button>
    <button
      type="button"
      onClick={deselectAll}
      className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Cancelar
    </button>
  </div>
)}
```

---

### 2. File: `src/components/ui/checkbox.tsx` (NEW)

**Source**: Generated via shadcn CLI  
**Command**: `npx shadcn@latest add checkbox -y`

**Expected Content**:
```typescript
"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

---

### 3. File: `src/app/actions/rutinas.ts`

**Current State (lines 1-537)**:  
Contains: `createRutina`, `updateRutina`, `duplicateRutina`, `deleteRutina`, `getRutinas`, `getRutina`, `createRutinaCompleta`

**Add New Server Action** (after line 307, before line 309):

```typescript
/**
 * Delete multiple Rutinas (bulk delete)
 * CRITICAL: Uses single deleteMany query — no individual deletes
 */
export async function deleteRutinas(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ deletedCount: number }>> {
  // 1. Verify admin access
  const authCheck = await verifyAdmin(await headers());
  if (!authCheck.authorized) {
    return { success: false, message: authCheck.message };
  }

  // 2. Extract and parse IDs from formData
  const idsJson = formData.get("ids");
  if (!idsJson || typeof idsJson !== "string") {
    return { success: false, message: "IDs inválidos" };
  }

  let ids: string[];
  try {
    ids = JSON.parse(idsJson) as string[];
  } catch {
    return { success: false, message: "Formato de IDs inválido" };
  }

  // 3. Validate array
  if (!Array.isArray(ids) || ids.length === 0) {
    return { success: false, message: "No hay rutinas seleccionadas" };
  }

  // 4. Execute single deleteMany query
  try {
    const result = await prisma.rutina.deleteMany({
      where: { id: { in: ids } },
    });

    // 5. Invalidate cache
    await revalidateRutinasCache();
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/rutinas");

    return {
      success: true,
      data: { deletedCount: result.count },
      message: `${result.count} rutinas eliminadas`,
    };
  } catch (error) {
    console.error("deleteRutinas error:", error);
    return { success: false, message: "Error al eliminar rutinas" };
  }
}
```

---

## Server Action Contract

### `deleteRutinas`

| Aspect | Contract |
|--------|----------|
| **Location** | `src/app/actions/rutinas.ts` |
| **Signature** | `(prevState: FormState, formData: FormData) => Promise<FormState<{ deletedCount: number }>>` |
| **Auth** | Admin session required (via `verifyAdmin`) |
| **Input** | `formData.get("ids")` as JSON string array `["uuid1", "uuid2", ...]` |
| **Queries** | Exactly ONE: `prisma.rutina.deleteMany({ where: { id: { in: ids } } })` |
| **Cascade** | Prisma cascade config handles related `dia` and `ejercicio` records |
| **Cache** | Calls `revalidateRutinasCache()`, `revalidatePath("/admin/dashboard")`, `revalidatePath("/admin/rutinas")` |
| **Success Return** | `{ success: true, data: { deletedCount: number }, message: string }` |
| **Error Return** | `{ success: false, message: string }` |

### `FormState<T>` Type (existing)

```typescript
// src/lib/schemas.ts line 138-143
interface FormState<T = void> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  message?: string;
}
```

---

## Data Flow

```
User clicks checkbox
        │
        ▼
toggleSelection(id)
        │
        ▼
setSelectedIds(new Set) ──► Re-render table with updated checkboxes
                                         │
                                         ▼
                        Bulk delete button appears (if size > 0)
                                         │
                                         ▼
                        User clicks "Eliminar seleccionadas"
                                         │
                                         ▼
                        window.confirm() dialog
                              │       │
                             Cancel   Confirm
                              │       │
                              ▼       ▼
                           No-op    FormData created
                                     with ids JSON
                                           │
                                           ▼
                                     toast.promise() starts
                                     loading toast shown
                                           │
                                           ▼
                                     deleteRutinas() called
                                     as server action
                                           │
                         ┌─────────────────┴─────────────────┐
                         │                               │
                    Success                           Error
                         │                               │
                         ▼                               ▼
            { deletedCount: N }              { success: false, message: ... }
                         │                               │
                         ▼                               ▼
            setSelectedIds(new Set())           Error toast shown
            router.refresh()
                         │
                         ▼
            Success toast: "N rutinas eliminadas"
```

---

## Implementation Order

### Step 1: Install shadcn Checkbox

```bash
npx shadcn@latest add checkbox -y
```

**Expected Output**:
- `src/components/ui/checkbox.tsx` created
- `components.json` updated with checkbox entry
- `src/lib/utils.ts` updated (if not exists, with `cn` function)

### Step 2: Add `deleteRutinas` Server Action

**File**: `src/app/actions/rutinas.ts`  
**Position**: After line 307 (after `deleteRutina` function)

No breaking changes to existing code. Only addition.

### Step 3: Update `rutinas-list-client.tsx`

**File**: `src/components/admin/rutinas-list-client.tsx`

| Change | Location | Lines Affected |
|--------|----------|----------------|
| Add `useRef` import | imports | +1 line |
| Add `deleteRutinas` import | imports | +1 line |
| Add `selectedIds` state | after line 27 | +1 line |
| Add selection helpers | after line 28 | +8 lines |
| Add `handleBulkDelete` | after line 55 | +17 lines |
| Add checkbox to `<thead>` | line 84 | +4 lines |
| Add checkbox to `<tbody>` first `<td>` | line 96 | +4 lines |
| Add bulk delete UI | before table (after line 77) | +8 lines |

---

## File Changes Summary

| File | Change Type | Lines Changed |
|------|-------------|---------------|
| `src/components/ui/checkbox.tsx` | **NEW** | ~33 lines |
| `src/app/actions/rutinas.ts` | Modified | +45 lines (after line 307) |
| `src/components/admin/rutinas-list-client.tsx` | Modified | +43 lines total |
| `components.json` | Modified | +1 entry |
| `package.json` | Modified | +1 dependency (`@radix-ui/react-checkbox`) |

---

## Dependencies

| Dependency | Version | Source | Purpose |
|------------|---------|--------|---------|
| `sonner` | 2.0.7 | existing | `toast.promise()` |
| `@radix-ui/react-checkbox` | latest | shadcn install | Checkbox component |
| `lucide-react` | existing | shadcn dep | Check icon |
| `class-variance-authority` | latest | shadcn dep | Style variants |
| `clsx` | latest | shadcn dep | `cn()` utility |
| `tailwind-merge` | latest | shadcn dep | `cn()` utility |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Prisma cascade not configured for `dia`/`ejercicio` | Low | Orphaned records | Check schema — cascade should be on `rutina.dias` and `dia.ejercicios` |
| Large selection causes performance issue | Low | UI lag | `Set<string>` is O(1) for operations; typical routine list < 100 items |
| Race condition: toggle + delete simultaneous | Low | Stale selection | Clear selection only after confirmed server success |
| `window.confirm` blocked by popup blocker | Low | User confusion | This is acceptable for admin tools; no workaround needed |
| Checkbox not installed before code deployment | Medium | Build fails | Task checklist includes explicit CLI command |

---

## Verification Checklist

After implementation, verify:

- [ ] `npx shadcn@latest add checkbox -y` runs without error
- [ ] `src/components/ui/checkbox.tsx` exists with valid export
- [ ] `deleteRutinas` function exists in `src/app/actions/rutinas.ts`
- [ ] Checkbox column appears in table header
- [ ] Checkbox in each row toggles selection state
- [ ] Header checkbox shows `indeterminate` state when partially selected
- [ ] "Eliminar seleccionadas" button appears when `selectedIds.size > 0`
- [ ] `window.confirm` dialog appears on bulk delete click
- [ ] Cancel in `window.confirm` does NOT trigger delete
- [ ] `toast.promise()` shows loading state during deletion
- [ ] Success toast shows correct count after deletion
- [ ] Selection clears after successful deletion
- [ ] Table refreshes (via `router.refresh()`) after deletion
- [ ] Individual `deleteRutina` action still works (no regression)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
