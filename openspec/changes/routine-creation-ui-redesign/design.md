# Design: routine-creation-ui-redesign

## Overview

Technical design for the routine creation UI redesign. This document covers component architecture, interactions, and implementation approach.

**Change**: routine-creation-ui-redesign  
**Proposal**: `openspec/proposals/routine-creation-ui-redesign.md`  
**Specs**: `openspec/changes/routine-creation-ui-redesign/specs/*/spec.md`

---

## 1. Component Architecture

### 1.1 Component Hierarchy

```
RutinaCompletaForm
├── RutinaHeader
│   ├── ChipSelector (tipo de rutina)
│   └── SubmitButton (Crear Rutina)
├── DiasList
│   └── DiaSection[] (collapsible)
│       ├── DiaHeader (toggle + delete + chevron)
│       └── EjerciciosList
│           └── EjercicioRow[]
└── ActionButtons
    ├── AddDiaButton
    └── AddEjercicioButton
```

### 1.2 File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/chip-selector.tsx` | **CREATE** | New ChipSelector component |
| `src/components/admin/dia-section.tsx` | MODIFY | Add collapsible behavior, animated chevron |
| `src/components/admin/ejercicio-row.tsx` | MODIFY | Horizontal layout, ultra-slim dark mode |
| `src/components/admin/rutina-completa-form.tsx` | MODIFY | Integrate components, manage day expansion state |
| `src/app/globals.css` | MODIFY | Add CSS tokens for light/dark themes |

---

## 2. Component Specifications

### 2.1 ChipSelector (`chip-selector.tsx`)

**Location**: `src/components/admin/chip-selector.tsx`

**Props Interface**:
```typescript
interface ChipSelectorProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}
```

**Implementation Notes**:
- Use `<button>` elements for accessibility
- Support keyboard navigation (Arrow keys between chips)
- Apply transition on border-color and background-color (100-150ms)
- Focus ring using `--focus-ring` token

**Light Mode Styles**:
```css
.chip {
  padding: 6px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border-light);
  background: transparent;
  color: var(--color-text-secondary);
  transition: all 100ms ease;
}

.chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.chip[data-selected] {
  background: var(--color-accent);
  color: var(--color-accent-foreground);
}
```

**Dark Mode Styles**:
```css
.dark .chip {
  border-color: var(--color-border-light);
  color: var(--color-text-secondary);
}

.dark .chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.dark .chip[data-selected] {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--color-accent-foreground);
}
```

---

### 2.2 CollapsibleDiaSection (`dia-section.tsx`)

**Location**: `src/components/admin/dia-section.tsx`

**Props Interface**:
```typescript
interface DiaSectionProps {
  dia: Dia;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (dia: Dia) => void;
  onDelete: () => void;
}
```

**User Decisions (IMPORTANT)**:
1. **Día 1 ALWAYS expanded on creation**: The first day of a new routine MUST be created in expanded state to give immediate visual feedback to beginners
2. **Days 2, 3, etc. created collapsed**: Subsequent days are created collapsed to reduce cognitive load
3. **Maximum 7 days enforced**: More than 7 day containers creates problematic vertical scroll in Home and Admin views. If a user needs more days, they should create a separate training "phase"

**Expansion Logic**:
```typescript
// When adding a new day
const addDay = () => {
  const newDay: Dia = {
    id: generateId(),
    nombre: '',
    ejercicios: []
  };
  
  setDias(prev => {
    if (prev.length >= 7) {
      toast.error('Máximo 7 días por rutina. Crea una nueva fase para más días.');
      return prev;
    }
    // New day is collapsed by default (unless it's the first day)
    return [...prev, newDay];
  });
};

// First day is always expanded
const [expandedDays, setExpandedDays] = useState<Set<string>>(
  dias.length > 0 ? new Set([dias[0].id]) : new Set()
);
```

**Header Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│ [▼] Día 1: [Nombre del día input]              [−] [🗑]    │
└──────────────────────────────────────────────────────────────┘
```

**Chevron Animation**:
```css
.chevron {
  transition: transform 150-200ms ease-out;
}

.chevron[data-expanded="true"] {
  transform: rotate(90deg);
}
```

**Dark Mode Card Style**:
```css
.dark .dia-card {
  background: var(--color-card);      /* #121212 */
  border: 1px solid var(--color-border-light);  /* #2a2a2a */
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
```

---

### 2.3 EjercicioRow (`ejercicio-row.tsx`)

**Location**: `src/components/admin/ejercicio-row.tsx`

**Props Interface**:
```typescript
interface EjercicioRowProps {
  ejercicio: Ejercicio;
  onUpdate: (ejercicio: Ejercicio) => void;
  onDelete: () => void;
}
```

**Horizontal Layout**:
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Nombre del ejercicio........................] [3] x [10]          [🗑]  │
│  Ej: Sentadillas con barra                                                │
└──────────────────────────────────────────────────────────────────────────┘
```

**Layout CSS (Tailwind)**:
```tsx
<div className="flex items-center gap-3">
  {/* Nombre - flexible width */}
  <Input 
    className="flex-1" 
    placeholder="Ej: Sentadillas con barra"
  />
  
  {/* Series - fixed narrow width */}
  <div className="flex items-center gap-1">
    <Input className="w-14 text-center" type="number" min={1} />
    <span className="text-muted-foreground">×</span>
    <Input className="w-14 text-center" type="number" min={1} />
  </div>
  
  {/* Delete button */}
  <Button variant="ghost" size="icon">
    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
  </Button>
</div>
```

**Dark Mode Ultra-Slim Inputs**:
```css
.dark .ejercicio-input {
  background: #2a2a2a;  /* Slightly lighter than card #121212 */
  border: 1px solid transparent;
  border-radius: 8px;
}

.dark .ejercicio-input:focus {
  border-color: var(--color-accent);
  box-shadow: var(--focus-ring);
}

.dark .ejercicio-input::placeholder {
  color: var(--color-placeholder);  /* #6b7280 */
}
```

**Error State**:
```css
.dark .ejercicio-input[data-error] {
  border-color: var(--color-error);  /* #ef4444 subtle */
}
```

---

### 2.4 Button Styles

**Submit Button ("Crear Rutina") - Dark Mode**:
```tsx
<Button className="bg-white text-black hover:bg-gray-100 rounded-xl font-semibold">
  + Crear Rutina
</Button>
```

**Add Day Button (Outline)**:
```tsx
<Button 
  variant="outline" 
  className="border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
>
  + Agregar Día
</Button>
```

**Add Exercise Button (Discrete)**:
```tsx
<button className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1">
  <Plus className="h-4 w-4" />
  <span>Agregar Ejercicio</span>
</button>
```

---

## 3. CSS Tokens (globals.css)

### 3.1 Light Mode Tokens

```css
:root {
  /* Brand Colors */
  --color-accent: #48b8c9;
  --color-accent-hover: #3da4b3;
  --color-accent-active: #35899f;
  --color-accent-foreground: #ffffff;
  
  /* Focus Ring */
  --focus-ring: 0 0 0 2px var(--color-accent);
  
  /* Existing tokens used */
  --color-base: #f9fafb;
  --color-card: #ffffff;
  --color-border-light: #e5e7eb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
}
```

### 3.2 Dark Mode Tokens

```css
.dark,
[data-theme="dark"] {
  --color-base: #0a0a0a;
  --color-card: #121212;
  --color-card-alt: #181818;
  --color-accent: #48b8c9;
  --color-accent-foreground: #ffffff;
  --color-primary-btn: #ffffff;
  --color-primary-btn-text: #0a0a0a;
  --color-text-primary: #ffffff;
  --color-text-secondary: #9ca3af;
  --color-border-light: #2a2a2a;
  --color-error: #ef4444;
  --color-placeholder: #6b7280;
  
  --focus-ring: 0 0 0 2px var(--color-accent);
}
```

---

## 4. Day Expansion Logic

### 4.1 State Management

```typescript
// In RutinaCompletaForm
const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(
  () => new Set(dias.length > 0 ? [dias[0].id] : [])
);

// Toggle expansion
const toggleDay = (dayId: string) => {
  setExpandedDayIds(prev => {
    const next = new Set(prev);
    if (next.has(dayId)) {
      next.delete(dayId);
    } else {
      next.add(dayId);
    }
    return next;
  });
};
```

### 4.2 Rules

| Scenario | Behavior |
|----------|----------|
| New routine created | Day 1 expanded, all others collapsed |
| Adding new day (day < 7) | New day starts collapsed |
| Deleting expanded day | If deleted day was expanded, expand next available or collapse all |
| Day count reaches 7 | Show toast warning, prevent adding more |

---

## 5. FAQ: User Decisions

### Q: Why is Day 1 always expanded?
**A**: Gives immediate visual feedback to beginners. They see exactly what to do without an extra click. Days 2+ are collapsed to avoid overwhelming the interface.

### Q: Why limit to 7 days?
**A**: More than 7 day containers creates problematic vertical scroll in Home and Admin views. If someone needs more days, they should create a separate training "phase" (a different routine).

### Q: What about editing existing routines with more than 7 days?
**A**: The UI will display all existing days but warn that future edits should split into phases. This is a UI constraint, not a data constraint.

---

## 6. Dependencies

```
Phase 1 (CSS Tokens)
       │
       ▼
Phase 2 (ChipSelector)
       │
       ▼
Phase 3 (CollapsibleDiaSection)
       │
       ▼
Phase 4 (EjercicioRow)
       │
       ▼
Phase 5 (Integration)
```

---

## 7. Accessibility

| Component | Keyboard Support |
|-----------|-----------------|
| ChipSelector | Tab to navigate, Enter/Space to select, Arrow keys between chips |
| DiaSection | Tab to header, Enter/Space to toggle, Delete key to remove |
| EjercicioRow | Standard Tab navigation between inputs |
| Buttons | Standard focus states with `--focus-ring` |
