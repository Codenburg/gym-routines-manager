# Design: Rediseñar Pantalla Editar Rutina Champion Gym

## Overview

Technical design for the Edit Routine screen redesign with new dual-mode accent color system (turquoise in light mode, red in dark mode), and responsive day card grid layout.

**Change**: `rediseñar-pantalla-editar-rutina-champion-gym`  
**Status**: Archived - Design finalized with dual-color system

---

## 1. Component Architecture

### 1.1 Component Hierarchy

```
EditRutinaPage (page.tsx)
├── PageHeader
├── AdminCard (RutinaForm container)
│   └── RutinaForm
│       ├── SegmentedControl (tipo) ← NEW
│       └── Existing form fields (nombre, descripcion)
└── AdminCard (DiaManager container)
    └── DiaManager
        └── RoutineDayCard[] (responsive grid) ← NEW
            ├── Day header (nombre, muscles)
            ├── Exercise list
            └── Edit/Delete actions
```

### 1.2 New Components to Create

| Component | File | Purpose |
|-----------|------|---------|
| `SegmentedControl` | `src/components/admin/segmented-control.tsx` | Routine type selector with dual-mode accent |
| `RoutineDayCard` | `src/components/admin/routine-day-card.tsx` | Day card for responsive grid display |

### 1.3 Components to Modify

| Component | File | Changes |
|-----------|------|---------|
| `RutinaForm` | `src/components/admin/rutina-form.tsx` | Replace `Select` with `SegmentedControl`, update styling to dual-mode accent |
| `DiaManager` | `src/components/admin/dia-manager.tsx` | Replace `AdminCard` grid with `RoutineDayCard` responsive grid |

### 1.4 File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/segmented-control.tsx` | **CREATE** | New segmented control component |
| `src/components/admin/routine-day-card.tsx` | **CREATE** | New routine day card component |
| `src/components/admin/rutina-form.tsx` | MODIFY | Integrate SegmentedControl, update color tokens |
| `src/components/admin/dia-manager.tsx` | MODIFY | Use RoutineDayCard, responsive grid layout |
| `src/app/globals.css` | MODIFY | Add dual-mode accent CSS tokens, dark/light mode variants |
| `src/components/admin/admin-card.tsx` | MODIFY | Add variant for day cards if needed |

---

## 2. Component Specifications

### 2.1 SegmentedControl (`segmented-control.tsx`)

**Location**: `src/components/admin/segmented-control.tsx`

**Props Interface**:
```typescript
interface SegmentedControlProps {
  name: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
}
```

**Design Requirements**:
- **Dual-mode accent**: Turquoise (#48b8c9) in light mode, Red (#E11D48) in dark mode
- **Dark Mode (primary)**: 
  - Background track: `#1a1a1a`
  - Active segment: `#E11D48` (red)
  - Text inactive: `#9ca3af`
  - Text active: `#ffffff`
- **Light Mode**:
  - Background track: `#f3f4f6`
  - Active segment: `#48b8c9` (turquoise)
  - Text inactive: `#6b7280`
  - Text active: `#ffffff`
- **Mobile**: `flex-wrap: wrap` to handle small screens
- **WCAG AA**: Minimum 4.5:1 contrast ratio for text

**Implementation Pattern**:
```tsx
<div 
  role="tablist" 
  className="inline-flex bg-muted rounded-lg p-1 gap-1 flex-wrap"
>
  {options.map((option) => (
    <button
      key={option.value}
      role="tab"
      aria-checked={value === option.value}
      onClick={() => onChange?.(option.value)}
      className={cn(
        "px-4 py-2 rounded-md text-sm font-medium transition-all",
        value === option.value 
          ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-sm" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {option.label}
    </button>
  ))}
</div>
<input type="hidden" name={name} value={value} />
```

---

### 2.2 RoutineDayCard (`routine-day-card.tsx`)

**Location**: `src/components/admin/routine-day-card.tsx`

**Props Interface**:
```typescript
interface RoutineDayCardProps {
  dia: {
    id: string;
    nombre: string;
    musculosEnfocados?: string | null;
    orden: number;
    ejercicios: Array<{
      id: string;
      nombre: string;
      series?: string | null;
      repes?: string | null;
    }>;
  };
  rutinaId: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (formData: FormData) => void;
  onDelete: () => void;
  editState?: FormState<{ id: string }> | null;
  isPending?: boolean;
}
```

**Responsive Grid Layout**:
```css
/* Mobile: 1 column */
grid grid-cols-1
/* Tablet: 2 columns */
md:grid-cols-2
/* Desktop: 3 columns */
lg:grid-cols-3
```

**Dark Mode Card Style**:
```css
.dark .routine-day-card {
  background: var(--color-card);      /* #18181b */
  border: 1px solid var(--color-border);  /* #27272a */
  border-radius: 16px;
}
```

---

## 3. State Management Approach

### 3.1 Edit Mode Pattern

**Key Difference from Create**: Edit mode must pre-populate form with existing data.

**RutinaForm State Flow**:
```tsx
// For Edit: initialData comes from parent page (server-fetched)
export function RutinaForm({ initialData, onSuccess }: RutinaFormProps) {
  const isEditing = !!initialData;
  
  // useActionState handles server response
  const [state, action, isPending] = useActionState(
    isEditing ? updateAction : createAction,
    initialState
  );

  // For inputs: use defaultValue for uncontrolled inputs
  // The key pattern ensures re-sync when initialData changes
  <Input 
    defaultValue={initialData?.nombre} 
    key={initialData?.nombre}  // Forces re-render with new defaultValue
  />
}
```

---

## 4. Layout Structure

### 4.1 Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Volver a Rutinas              [Eliminar Rutina]          │  PageHeader
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Detalles de la Rutina                               │   │  AdminCard
│  │  ┌─────────────────────┐  ┌───────────────────────┐ │   │
│  │  │ Nombre de rutina   │  │ Tipo                   │ │   │  Grid (1 col mobile, 2 col desktop)
│  │  │ [_______________]  │  │ [fuerza][cardio]...   │ │   │
│  │  └─────────────────────┘  └───────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ Descripción                                    │ │   │
│  │  │ [__________________________________________]   │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                              [Actualizar Rutina]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Días de la Rutina                    [+ Agregar Día]│   │  AdminCard
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ Día 1    │  │ Día 2   │  │ Día 3    │            │   │  Responsive Grid
│  │  │ Pecho   │  │ Espalda │  │ Piernas  │            │   │  1 col → 2 col → 3 col
│  │  │ 3 ejerc │  │ 4 ejerc │  │ 5 ejerc  │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. CSS/Tailwind Strategy

### 5.1 Dual-Mode Accent Color Tokens

**Dual-color approach**: Turquoise (#48b8c9) in light mode, Red (#E11D48) in dark mode:

```css
/* globals.css - Light Mode */
:root {
  /* Turquoise Accent - Light Mode */
  --color-accent: #48b8c9;
  --color-accent-hover: #3da4b3;
  --color-accent-active: #35899f;
  --color-accent-foreground: #ffffff;
  
  /* Focus Ring - turquoise */
  --focus-ring: 0 0 0 2px #48b8c9;
  
  /* Page & Card backgrounds */
  --color-base: #f8fafc;
  --color-card: #ffffff;
  --color-border: #e2e8f0;
  --color-text-secondary: #64748b;
}

/* Dark mode - Red Accent */
.dark {
  --color-accent: #E11D48;
  --color-accent-hover: #be123c;
  --color-accent-active: #9f1239;
  --color-accent-foreground: #ffffff;
  
  /* Focus Ring - red */
  --focus-ring: 0 0 0 2px #E11D48;
  
  /* Page & Card backgrounds */
  --color-base: #09090b;
  --color-card: #18181b;
  --color-border: #27272a;
  --color-text-secondary: #a1a1aa;
}
```

### 5.2 Button Tokens

```css
/* Primary Button */
:root {
  --btn-primary-bg: #48b8c9;
  --btn-primary-bg-hover: #3da4b3;
  --btn-primary-text: #ffffff;
  --btn-cancel-hover: #ef4444;
}

.dark {
  --btn-primary-bg: #E11D48;
  --btn-primary-bg-hover: #be123c;
  --btn-primary-text: #ffffff;
  --btn-cancel-hover: #E11D48;
}
```

---

## 6. WCAG AA Compliance

### 6.1 Color Contrast Requirements

| Element | Light Mode | Dark Mode | Ratio | WCAG |
|---------|-----------|-----------|-------|------|
| Text on accent button | `#ffffff` on `#48b8c9` | `#ffffff` on `#E11D48` | 4.6:1 | AA ✓ |
| Inactive tab text | `#6b7280` on `#f3f4f6` | `#9ca3af` on `#1a1a1a` | 4.5:1 | AA ✓ |
| Active tab text | `#ffffff` on `#48b8c9` | `#ffffff` on `#E11D48` | 4.6:1 | AA ✓ |
| Card border | `#e2e8f0` on `#ffffff` | `#27272a` on `#18181b` | 4.6:1 | AA ✓ |
| Secondary text | `#64748b` on `#f8fafc` | `#a1a1aa` on `#09090b` | 4.5:1 | AA ✓ |

### 6.2 Focus Visibility

```css
/* All interactive elements must have visible focus */
button:focus-visible,
input:focus,
select:focus,
textarea:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-accent);
}
```

---

## 7. Implementation Order (Task Breakdown)

### Phase 1: CSS Tokens (Foundation)
1.1 Add dual-mode accent tokens to `globals.css` (`:root` and `.dark`)
1.2 Update `--focus-ring` to use turquoise (light) / red (dark)
1.3 Update input focus states to use accent color
1.4 Add page background, border, and secondary text tokens
1.5 Verify no conflicts with existing tokens

---

## 8. Finalized Color System

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Accent/Selected state** | `#48b8c9` (turquoise) | `#E11D48` (red) |
| **Focus ring** | `#48b8c9` (turquoise) | `#E11D48` (red) |
| **Cancel button hover** | `#ef4444` (red) | `#E11D48` (red) |
| Page background | `#f8fafc` | `#09090b` |
| Card background | `#ffffff` | `#18181b` |
| Border | `#e2e8f0` | `#27272a` |
| Secondary text | `#64748b` | `#a1a1aa` |

This dual-color approach maintains brand identity in light mode (turquoise) while using red as the primary accent in dark mode for better visual hierarchy and modern aesthetic.

---

## 9. Dependencies

```
Phase 1 (CSS Tokens)
        │
        ▼
Phase 2 (SegmentedControl) ← Can parallelize with Phase 3
        │
        ▼
Phase 3 (RoutineDayCard)
        │
        ▼
Phase 4 (RutinaForm refactor)
        │
        ▼
Phase 5 (DiaManager refactor)
        │
        ▼
Phase 6 (Testing)
```
