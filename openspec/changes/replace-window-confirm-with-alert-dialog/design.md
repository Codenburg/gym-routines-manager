# Design: Replace window.confirm() with AlertDialog

## Technical Approach

Replace all `window.confirm()` calls across 6 admin components with a Promise-based `useConfirm` hook that renders a shadcn `AlertDialog`. The solution uses a singleton pattern where a single `ConfirmDialog` component is rendered once per page and controlled globally via the hook, avoiding duplicate dialogs while supporting multiple confirmation use cases.

This is a **UI layer refactor** — replacing browser-native confirmation with a styled, accessible dialog component.

## Architecture Decisions

### Decision: Singleton Dialog Pattern via Hook

**Choice**: Create a `useConfirm` hook that returns `{ confirm, Dialog }` where `Dialog` is rendered inline and `confirm()` returns a `Promise<boolean>`.

**Alternatives considered**:
- **Context Provider pattern**: Wrap app in a provider, use `useContext()` — overkill for confirmation dialogs
- **Render prop pattern**: Pass `Dialog` as render prop — more complex API
- **Toast-based confirmation**: Use sonner for non-blocking feedback — inappropriate for destructive actions requiring explicit user consent
- **Multiple dialog instances**: Create new dialog per component — memory leak risk, poor UX

**Rationale**: The singleton pattern is the simplest solution that satisfies the requirements:
- Single dialog instance managed globally
- Promise-based API matches `window.confirm()` semantics
- Each component gets its own `confirm()` function and renders the dialog inline
- Works well with Next.js App Router "use client" components

### Decision: Controlled Dialog with Internal State

**Choice**: `ConfirmDialog` is a controlled component with `open` state managed inside the hook, not in the component consuming it.

**Alternatives considered**:
- Uncontrolled pattern with `useRef` to imperatively open/close — breaks React paradigms
- External `open` state passed to hook — would require lifting state in consuming component

**Rationale**: By encapsulating all state inside `useConfirm`, the consuming component only needs to:
1. Call `confirm()` to trigger
2. Render `{Dialog}` once

No state management needed in the consumer.

### Decision: `variant="destructive"` for Destructive Actions

**Choice**: Destructive confirmations (delete operations) use `variant="destructive"` which renders a red button. Non-destructive (duplicate) uses default variant.

**Rationale**: Matches shadcn AlertDialog conventions and the existing design system where destructive actions use `--destructive` CSS variable for visual warning.

### Decision: AlertDialog Installed via CLI

**Choice**: Install `alert-dialog` using `npx shadcn@latest add alert-dialog` rather than copying from docs.

**Rationale**: Per project conventions (`ui_components.rules` in openspec/config.yaml): "Components MUST be installed via shadcn CLI, NOT copied from documentation."

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Component A                               │
│  const { confirm, Dialog } = useConfirm();                       │
│                                                                  │
│  const handleDelete = async () => {                            │
│    const confirmed = await confirm({                           │
│      title: "¿Eliminar rutina?",                                 │
│      description: "Esta acción no se puede deshacer.",          │
│      variant: "destructive"                                     │
│    });                                                          │
│    if (!confirmed) return;                                      │
│    // deletion logic                                             │
│  };                                                             │
│                                                                  │
│  return (                                                        │
│    <>                                                           │
│      <button onClick={handleDelete}>Eliminar</button>          │
│      {Dialog}  ← Renders ConfirmDialog once                     │
│    </>                                                          │
│  );                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         useConfirm Hook                          │
│                                                                  │
│  - Uses useRef to store resolver function                        │
│  - Manages { title, description, variant, confirmText } state   │
│  - Returns { confirm: (options) => Promise<boolean>, Dialog }   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ConfirmDialog                         │   │
│  │  <AlertDialog open={isOpen} onOpenChange={setIsOpen}>   │   │
│  │    <AlertDialogContent>                                 │   │
│  │      <AlertDialogHeader>                                │   │
│  │        <AlertDialogTitle>{title}</AlertDialogTitle>    │   │
│  │        <AlertDialogDescription>{description}</...>     │   │
│  │      </AlertDialogHeader>                               │   │
│  │      <AlertDialogFooter>                                │   │
│  │        <AlertDialogCancel onClick={() => resolve(false)>│   │
│  │        <AlertDialogAction                              │   │
│  │          variant={variant === "destructive" ? "..." :  │   │
│  │                   undefined}                            │   │
│  │          onClick={() => resolve(true)}>                 │   │
│  │          {confirmText}                                 │   │
│  │        </AlertDialogAction>                            │   │
│  │      </AlertDialogFooter>                               │   │
│  │    </AlertDialogContent>                                │   │
│  │  </AlertDialog>                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Promise Resolution                            │
│                                                                  │
│  User clicks "Eliminar" → resolver(true) → handleDelete continues│
│  User clicks "Cancel"   → resolver(false) → handleDelete returns │
└─────────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui/alert-dialog.tsx` | Create | shadcn AlertDialog component (via CLI) |
| `src/components/confirm-dialog.tsx` | Create | Wrapper around AlertDialog with custom props |
| `src/hooks/use-confirm.ts` | Create | Hook exposing `confirm()` function, manages dialog state |
| `src/components/admin/delete-rutina-button.tsx` | Modify | Replace `window.confirm()` with `useConfirm` |
| `src/components/admin/delete-rutina-page-button.tsx` | Modify | Replace `window.confirm()` with `useConfirm` |
| `src/components/admin/dia-manager.tsx` | Modify | Replace `window.confirm()` with `useConfirm` |
| `src/components/admin/feriado-manager.tsx` | Modify | Replace `window.confirm()` with `useConfirm` |
| `src/components/admin/ejercicio-list.tsx` | Modify | Replace `window.confirm()` with `useConfirm` |
| `src/components/admin/rutinas-list-client.tsx` | Modify | Replace `window.confirm()` with `useConfirm` |

## Interfaces / Contracts

### `ConfirmDialogProps`

```typescript
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: "destructive" | "default";
  confirmText?: string;
  onConfirm: () => void;
}
```

### `useConfirmOptions`

```typescript
interface useConfirmOptions {
  title: string;
  description?: string;
  variant?: "destructive" | "default";
  confirmText?: string;
}
```

### `useConfirmReturn`

```typescript
interface useConfirmReturn {
  confirm: (options: useConfirmOptions) => Promise<boolean>;
  Dialog: React.ReactElement;
}
```

## Component Specifications

### `src/components/confirm-dialog.tsx`

A thin wrapper around shadcn AlertDialog providing:

```tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: "destructive" | "default";
  confirmText?: string;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = "default",
  confirmText,
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = variant === "destructive";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant={isDestructive ? "destructive" : undefined}
            onClick={onConfirm}
          >
            {confirmText ?? (isDestructive ? "Eliminar" : "Confirmar")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### `src/hooks/use-confirm.ts`

Singleton pattern hook managing a single dialog instance:

```tsx
"use client";

import { useState, useRef, useCallback } from "react";
import type { useConfirmOptions } from "@/components/confirm-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function useConfirm() {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    variant?: "destructive" | "default";
    confirmText?: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    onConfirm: () => {},
  });

  const resolverRef = useRef<(value: boolean) => void | null>(null);

  const confirm = useCallback(
    (options: useConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;
        setDialogState({
          open: true,
          title: options.title,
          description: options.description,
          variant: options.variant ?? "default",
          confirmText: options.confirmText,
          onConfirm: () => {
            resolve(true);
            setDialogState((prev) => ({ ...prev, open: false }));
          },
        });
      });
    },
    []
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setDialogState((prev) => ({ ...prev, open }));
    if (!open && resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const Dialog = (
    <ConfirmDialog
      open={dialogState.open}
      onOpenChange={handleOpenChange}
      title={dialogState.title}
      description={dialogState.description}
      variant={dialogState.variant}
      confirmText={dialogState.confirmText}
      onConfirm={dialogState.onConfirm}
    />
  );

  return { confirm, Dialog };
}
```

## Migration Guide: Per-File Changes

### 1. `delete-rutina-button.tsx`

**Before:**
```tsx
"use client";

import { useState } from "react";
import { deleteRutina } from "@/app/actions/rutinas";
import { Trash2 } from "lucide-react";

export function DeleteRutinaButton({ rutinaId }: DeleteRutinaButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta rutina?")) {
      return;
    }
    // ... deletion logic
  };

  return (
    <button onClick={handleDelete} ...>
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
```

**After:**
```tsx
"use client";

import { useState } from "react";
import { deleteRutina } from "@/app/actions/rutinas";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/hooks/use-confirm";

export function DeleteRutinaButton({ rutinaId }: DeleteRutinaButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { confirm, Dialog } = useConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "¿Eliminar rutina?",
      description: "Esta acción no se puede deshacer.",
      variant: "destructive",
    });
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("id", rutinaId);
      await deleteRutina({ success: false }, formData);
      window.location.href = "/admin/rutinas";
    } catch (error) {
      console.error("Error deleting:", error);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button onClick={handleDelete} disabled={isDeleting} ...>
        <Trash2 className="w-5 h-5" />
      </button>
      {Dialog}
    </>
  );
}
```

### 2. `delete-rutina-page-button.tsx`

**Before:**
```tsx
const handleDelete = async () => {
  if (!confirm("¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.")) {
    return;
  }
  // ... deletion logic
};
```

**After:**
```tsx
const { confirm, Dialog } = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "¿Eliminar rutina?",
    description: "Esta acción no se puede deshacer.",
    variant: "destructive",
  });
  if (!confirmed) return;
  // ... deletion logic
};

// In JSX: {Dialog} after button
```

### 3. `dia-manager.tsx`

**Before:**
```tsx
const handleDelete = async (diaId: string) => {
  if (!confirm("¿Estás seguro de que quieres eliminar este día?")) return;
  const formData = new FormData();
  formData.append("id", diaId);
  formData.append("rutinaId", rutinaId);
  await deleteActionTyped(null, formData);
};
```

**After:**
```tsx
const { confirm, Dialog } = useConfirm();

const handleDelete = async (diaId: string) => {
  const confirmed = await confirm({
    title: "¿Eliminar día?",
    description: "Esta acción no se puede deshacer.",
    variant: "destructive",
  });
  if (!confirmed) return;
  const formData = new FormData();
  formData.append("id", diaId);
  formData.append("rutinaId", rutinaId);
  await deleteActionTyped(null, formData);
};
```

### 4. `feriado-manager.tsx`

**Before:**
```tsx
const handleDelete = async (id: string) => {
  if (!confirm("¿Estás seguro de que quieres eliminar este feriado?")) {
    return;
  }
  // ... deletion logic
};
```

**After:**
```tsx
const { confirm, Dialog } = useConfirm();

const handleDelete = async (id: string) => {
  const confirmed = await confirm({
    title: "¿Eliminar feriado?",
    description: "Esta acción no se puede deshacer.",
    variant: "destructive",
  });
  if (!confirmed) return;
  // ... deletion logic
};
```

### 5. `ejercicio-list.tsx`

**Before:**
```tsx
const handleDelete = async (ejercicioId: string) => {
  if (!confirm("¿Estás seguro de que quieres eliminar este ejercicio?")) return;
  const formData = new FormData();
  formData.append("id", ejercicioId);
  await deleteActionTyped(null, formData);
};
```

**After:**
```tsx
const { confirm, Dialog } = useConfirm();

const handleDelete = async (ejercicioId: string) => {
  const confirmed = await confirm({
    title: "¿Eliminar ejercicio?",
    description: "Esta acción no se puede deshacer.",
    variant: "destructive",
  });
  if (!confirmed) return;
  const formData = new FormData();
  formData.append("id", ejercicioId);
  await deleteActionTyped(null, formData);
};
```

### 6. `rutinas-list-client.tsx`

**Before:**
```tsx
const handleDuplicate = async (rutinaId: string) => {
  if (!confirm("¿Estás seguro de que quieres duplicar esta rutina?")) {
    return;
  }
  // ... duplication logic
};
```

**After:**
```tsx
const { confirm, Dialog } = useConfirm();

const handleDuplicate = async (rutinaId: string) => {
  const confirmed = await confirm({
    title: "¿Duplicar rutina?",
    variant: "default",
    confirmText: "Duplicar",
  });
  if (!confirmed) return;
  // ... duplication logic
};
```

**Note**: This is a non-destructive action, so `variant="default"` (no red button) and `confirmText="Duplicar"`.

## Error Handling Considerations

### Promise Never Resolves (Safety Net)

If `resolverRef.current` is never called (edge case), the user would be stuck with an open dialog. To handle this:

- `handleOpenChange` resets the resolver to `false` when dialog closes via cancel/outside click
- This matches `window.confirm()` behavior where closing the dialog = cancel

### Multiple Rapid Calls

If `confirm()` is called while a dialog is already open:
- The second call will overwrite state, potentially resolving the first promise with `false`
- This is acceptable behavior — only one dialog should be shown at a time

### Server Components

The `useConfirm` hook uses `"use client"` directive. It CANNOT be used in Server Components. All 6 files being modified already have `"use client"` at the top, so no change needed.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useConfirm` resolver fires on confirm | Test with render hook, simulate click |
| Unit | `useConfirm` resolver fires `false` on cancel | Test with render hook, simulate cancel |
| Unit | `useConfirm` resolver fires `false` when dialog closes via overlay | Test click-outside behavior |
| Integration | All 6 components render `Dialog` | Visual inspection after migration |
| Integration | Delete confirmation works in each component | Manual test: click delete → see dialog → click cancel/confirm |
| Integration | Duplicate confirmation works | Manual test: click duplicate → see dialog → click cancel/confirm |
| Build | No TypeScript errors | `npx tsc --noEmit` |
| Build | No ESLint errors | `npm run lint` |
| Build | Production build succeeds | `npm run build` |

## Migration / Rollback

**Rollback**: `git checkout -- src/components/ui/alert-dialog.tsx src/components/confirm-dialog.tsx src/hooks/use-confirm.ts src/components/admin/`

**No database migration required** — purely frontend UI changes.

**No breaking changes** — API change from `window.confirm()` to `useConfirm().confirm()` is internal to each component.

## Open Questions

- [ ] **Duplicate confirmation text**: Should `confirmText` for "Duplicar" be "Duplicar" or leave as default "Confirmar"? Based on the spec, it should be "Duplicar".
- [ ] **Animation/transition**: shadcn AlertDialog handles animations automatically via Radix — no custom handling needed.

## Verification Checklist

After implementation, verify:

- [ ] `alert-dialog` component installed via `npx shadcn@latest add alert-dialog`
- [ ] `src/components/ui/alert-dialog.tsx` exists and contains all AlertDialog exports
- [ ] `src/components/confirm-dialog.tsx` created with correct props interface
- [ ] `src/hooks/use-confirm.ts` created with singleton pattern
- [ ] All 6 files import `useConfirm` from `@/hooks/use-confirm`
- [ ] All 6 files render `{Dialog}` in their JSX return
- [ ] All 6 files use correct `variant` ("destructive" for delete, "default" for duplicate)
- [ ] All 6 files use correct Spanish titles and descriptions
- [ ] Delete buttons show red "Eliminar" button
- [ ] Duplicate button shows default "Duplicar" button
- [ ] Cancel always resolves promise with `false`
- [ ] Clicking action button resolves promise with `true`
- [ ] Clicking overlay/outside resolves promise with `false`
- [ ] `npm run build` succeeds without errors
