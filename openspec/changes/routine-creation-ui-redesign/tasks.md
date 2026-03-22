# Tasks: routine-creation-ui-redesign

## Overview

Implementation tasks for the routine creation UI redesign. This includes CSS tokens for both themes, the new ChipSelector component, collapsible day sections with the "Day 1 expanded, others collapsed" logic, improved EjercicioRow layout, and proper button styling.

**Change**: routine-creation-ui-redesign  
**Spec**: `openspec/changes/routine-creation-ui-redesign/specs/*/spec.md`  
**Design**: `openspec/changes/routine-creation-ui-redesign/design.md`

---

## Phase 1: CSS Tokens (Design System)

### 1.1 Add Light Mode Tokens to globals.css

- [x] **1.1.1** Open `src/app/globals.css` and locate the `:root` selector
- [x] **1.1.2** Add brand color tokens after existing tokens:
  ```css
  /* Brand Colors - Light Mode */
  --color-accent: #48b8c9;
  --color-accent-hover: #3da4b3;
  --color-accent-active: #35899f;
  --color-accent-foreground: #ffffff;
  
  /* Focus Ring */
  --focus-ring: 0 0 0 2px var(--color-accent);
  ```
- [x] **1.1.3** Verify light mode `--color-base`, `--color-card`, `--color-border-light`, `--color-text-primary`, `--color-text-secondary` are defined
- [x] **1.1.4** Run visual test: confirm form uses light theme tokens

**Verification**: Form in light mode shows `#48b8c9` accent color on focus states

### 1.2 Add Dark Mode Tokens to globals.css

- [x] **1.2.1** Open `src/app/globals.css` and locate or create dark mode selector (`.dark` or `[data-theme="dark"]`)
- [x] **1.2.2** Add dark mode tokens:
  ```css
  /* Dark Mode Tokens */
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
  ```
- [x] **1.2.3** Run visual test: toggle dark mode, confirm `#0a0a0a` background and `#121212` cards

**Verification**: Dark mode form shows charcoal cards (`#121212`) on black background (`#0a0a0a`)

### 1.3 Apply Focus Ring to Interactive Elements

- [x] **1.3.1** Add global focus styles to `globals.css`:
  ```css
  input:focus,
  select:focus,
  textarea:focus,
  button:focus-visible {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: var(--focus-ring);
  }
  ```
- [x] **1.3.2** Run keyboard navigation test: Tab through form inputs, confirm turquesa focus ring appears

**Verification**: All interactive elements show `--focus-ring` (turquoise outline) on keyboard focus

---

## Phase 2: ChipSelector Component

### 2.1 Create ChipSelector Component

- [x] **2.1.1** Create new file `src/components/admin/chip-selector.tsx`
- [x] **2.1.2** Implement component with props interface:
  ```typescript
  interface ChipSelectorProps {
    options: Array<{ value: string; label: string }>;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }
  ```
- [x] **2.1.3** Render chips using `<button>` elements for accessibility
- [x] **2.1.4** Implement keyboard navigation (Arrow keys between chips)
- [x] **2.1.5** Apply light mode styles (unselected: border + secondary text, selected: accent bg + white text)
- [x] **2.1.6** Apply dark mode styles (unselected: `#2a2a2a` border + `#9ca3af` text, selected: accent border + bg)
- [x] **2.1.7** Add transitions: `transition: all 100ms ease` for hover, `150ms` for selection

**Reference**: Design section "2.1 ChipSelector" and Spec "Requirement: ChipSelector Component"

**Verification**: 
- Chips visible with correct states (default/hover/selected)
- Dark mode chips show accent border + background when selected
- Keyboard navigation works (Arrow keys, Enter/Space to select)

### 2.2 Integrate ChipSelector into RutinaCompletaForm

- [x] **2.2.1** Open `src/components/admin/rutina-completa-form.tsx`
- [x] **2.2.2** Import `ChipSelector` from `./chip-selector`
- [x] **2.2.3** Replace existing `<Select>` dropdown for routine type with `<ChipSelector>`
- [x] **2.2.4** Pass options: `[{ value: 'fuerza', label: '💪 Fuerza' }, { value: 'cardio', label: '🏃 Cardio' }, ...]`
- [x] **2.2.5** Connect `value` and `onChange` to form state

**Reference**: Proposal section "3.1 ChipSelector para Tipo de Rutina" visual examples

**Verification**: Routine type selection shows chips instead of dropdown, works in both themes

---

## Phase 3: CollapsibleDiaSection

### 3.1 Modify DiaSection for Collapsible State

- [x] **3.1.1** Open `src/components/admin/dia-section.tsx`
- [x] **3.1.2** Add `isExpanded: boolean` and `onToggle: () => void` to props interface
- [x] **3.1.3** Add click handler to header that calls `onToggle()`
- [x] **3.1.4** Conditionally render exercises list based on `isExpanded` state
- [x] **3.1.5** Add chevron icon with rotation animation:
  ```tsx
  <Chevron className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
  ```
- [x] **3.1.6** Apply dark mode card styles: `bg-[var(--color-card)] border border-[var(--color-border-light)] rounded-xl`

**Reference**: Design section "2.2 CollapsibleDiaSection" and Spec "Requirement: CollapsibleDiaSection Component"

**Verification**: Clicking header toggles expand/collapse with smooth animation

### 3.2 Add Delete Button to DiaSection Header

- [x] **3.2.1** Open `src/components/admin/dia-section.tsx`
- [x] **3.2.2** Add Trash2 icon button to header (after the title/nombre input)
- [x] **3.2.3** Apply hover style: `hover:text-[var(--color-error)]`
- [x] **3.2.4** Connect to `onDelete` prop

**Reference**: Design section "2.2" header layout diagram

**Verification**: Delete button visible in header, changes to red on hover

### 3.3 Implement Day 1 Expanded Logic

- [x] **3.3.1** Open `src/components/admin/rutina-completa-form.tsx`
- [x] **3.3.2** Add state for tracking expanded days:
  ```typescript
  const [expandedDayIds, setExpandedDayIds] = useState<Set<string>>(
    () => new Set(dias.length > 0 ? [dias[0].id] : [])
  );
  ```
- [x] **3.3.3** Add toggle handler:
  ```typescript
  const toggleDay = (dayId: string) => {
    setExpandedDayIds(prev => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };
  ```
- [x] **3.3.4** Pass `isExpanded={expandedDayIds.has(dia.id)}` and `onToggle={() => toggleDay(dia.id)}` to each DiaSection
- [x] **3.3.5** When adding a new day, do NOT add to `expandedDayIds` (starts collapsed unless it's day 1)

**User Decision**: Day 1 is ALWAYS expanded on creation. Days 2, 3, etc. start collapsed.

**Reference**: Design section "4. Day Expansion Logic"

**Verification**: New routine shows Day 1 expanded, adding Day 2 keeps it collapsed, clicking Day 2 header expands it

### 3.4 Add 7-Day Limit with Validation

- [x] **3.4.1** Open `src/components/admin/rutina-completa-form.tsx`
- [x] **3.4.2** In the add day handler, check `dias.length >= 7` before adding
- [x] **3.4.3** If limit reached, show toast: "Máximo 7 días por rutina. Crea una nueva fase para más días."
- [x] **3.4.4** Disable or hide "+ Agregar Día" button when at limit

**User Decision**: More than 7 day containers creates problematic vertical scroll in Home and Admin views.

**Verification**: Adding 7th day succeeds, attempting to add 8th shows toast and does not add

---

## Phase 4: EjercicioRow Improvements

### 4.1 Redesign Layout to Horizontal Format

- [x] **4.1.1** Open `src/components/admin/ejercicio-row.tsx`
- [x] **4.1.2** Change layout from vertical stack to horizontal flex row:
  ```
  [Nombre input............] [3] x [10] [🗑]
  ```
- [x] **4.1.3** Apply Tailwind classes: `flex flex-row items-center gap-3`
- [x] **4.1.4** Set Nombre input to `flex-1` for flexible width
- [x] **4.1.5** Set Series/Repes inputs to fixed narrow width: `w-14 text-center`
- [x] **4.1.6** Add "×" separator between Series and Repes

**Reference**: Design section "2.3 EjercicioRow" layout diagram

**Verification**: Exercise row shows horizontal layout with all fields in one line

### 4.2 Add Descriptive Placeholders

- [x] **4.2.1** Open `src/components/admin/ejercicio-row.tsx`
- [x] **4.2.2** Add placeholder to Nombre input:
  - Light mode: `"Ej: Sentadillas con barra"`
  - Dark mode: `"Ej: Press de banca"`
- [x] **4.2.3** Apply placeholder color using CSS variable: `placeholder:text-[var(--color-placeholder)]` for dark mode
- [x] **4.2.4** Ensure placeholders inherit theme-appropriate color in light mode

**Reference**: Spec "Requirement: Descriptive Placeholder Guidance"

**Verification**: Placeholder text is descriptive and theme-appropriate

### 4.3 Apply Ultra-Slim Dark Mode Styles

- [x] **4.3.1** Open `src/components/admin/ejercicio-row.tsx`
- [x] **4.3.2** Add dark mode specific input styles:
  ```css
  .dark .ejercicio-input {
    background: #2a2a2a;
    border: 1px solid transparent;
  }
  .dark .ejercicio-input:focus {
    border-color: var(--color-accent);
    box-shadow: var(--focus-ring);
  }
  ```
- [x] **4.3.3** Apply via conditional className or CSS module
- [x] **4.3.4** Ensure light mode inputs retain original bordered style

**Reference**: Design section "2.3" dark mode specifications

**Verification**: Dark mode inputs are ultra-slim (no heavy borders), light mode inputs have visible borders

### 4.4 Add Error State with Coral Border

- [x] **4.4.1** Open `src/components/admin/ejercicio-row.tsx`
- [x] **4.4.2** Add error prop or derive from validation state
- [x] **4.4.3** Apply error border: `border-[var(--color-error)]` (subtle, not overwhelming)
- [x] **4.4.4** Test error display in both light and dark modes

**Reference**: Spec "Requirement: Error State Visibility"

**Verification**: Invalid inputs show coral (`#ef4444`) border in both themes

---

## Phase 5: Button Styling

### 5.1 Style "Crear Rutina" Submit Button

- [x] **5.1.1** Open `src/components/admin/rutina-completa-form.tsx`
- [x] **5.1.2** Locate or add the submit button (should be in header/top area)
- [x] **5.1.3** Apply dark mode solid white style:
  ```tsx
  <Button className="bg-white text-black hover:bg-gray-100 rounded-xl font-semibold">
    + Crear Rutina
  </Button>
  ```
- [x] **5.1.4** Position button in upper right corner of form header

**Reference**: Design section "2.4" button styles and Proposal section "3.7"

**Verification**: Submit button is solid white with black text in dark mode, upper right corner

### 5.2 Style "+ Agregar Día" as Outline Button

- [x] **5.2.1** Open `src/components/admin/rutina-completa-form.tsx`
- [x] **5.2.2** Find "+ Agregar Día" button
- [x] **5.2.3** Apply outline variant with dark mode styles:
  ```tsx
  <Button 
    variant="outline" 
    className="border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
  >
    + Agregar Día
  </Button>
  ```
- [x] **5.2.4** Center the button within the form

**Reference**: Design section "2.4" outline button specs

**Verification**: "+ Agregar Día" is outline style with subtle border, turquesa on hover

### 5.3 Style "+ Agregar Ejercicio" as Discrete Button

- [x] **5.3.1** Open `src/components/admin/rutina-completa-form.tsx` (or dia-section.tsx)
- [x] **5.3.2** Find "+ Agregar Ejercicio" button
- [x] **5.3.3** Convert to discrete text + icon style:
  ```tsx
  <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1">
    <Plus className="h-4 w-4" />
    <span>Agregar Ejercicio</span>
  </button>
  ```
- [x] **5.3.4** Ensure no background/border, just text and icon

**Reference**: Design section "2.4" discrete button specs

**Verification**: "+ Agregar Ejercicio" is subtle text+icon, no button styling, turquesa on hover

---

## Phase 6: Integration and Polish

### 6.1 Connect All Components in RutinaCompletaForm

- [ ] **6.1.1** Open `src/components/admin/rutina-completa-form.tsx`
- [ ] **6.1.2** Verify ChipSelector replaces dropdown for type selection
- [ ] **6.1.3** Verify DiaSection components receive all required props (isExpanded, onToggle, onDelete)
- [ ] **6.1.4** Verify expandedDayIds state correctly controls which days are expanded
- [ ] **6.1.5** Verify EjercicioRow components use horizontal layout within expanded days

### 6.2 Test Day Expansion/Collapse Behavior

- [ ] **6.2.1** Create new routine: Day 1 should be expanded by default
- [ ] **6.2.2** Click "+ Agregar Día": Day 2 appears collapsed
- [ ] **6.2.3** Click Day 2 header: Day 2 expands with animation
- [ ] **6.2.4** Click Day 1 header: Day 1 collapses
- [ ] **6.2.5** Verify chevron rotates smoothly (150-200ms)

### 6.3 Test Theme Switching

- [ ] **6.3.1** View form in light mode: verify all tokens apply correctly
- [ ] **6.3.2** Toggle to dark mode: verify instant theme switch
- [ ] **6.3.3** Check all components: ChipSelector, DiaSection, EjercicioRow, buttons
- [ ] **6.3.4** Verify no hardcoded colors leak through (all use CSS variables)

### 6.4 Run TypeScript Compilation

- [ ] **6.4.1** Run `npx tsc --noEmit` to verify no type errors
- [ ] **6.4.2** Fix any TypeScript errors before proceeding

### 6.5 Run ESLint

- [ ] **6.5.1** Run `npm run lint` to verify code quality
- [ ] **6.5.2** Fix any linting errors or warnings

---

## Phase 7: Accessibility Testing

### 7.1 Keyboard Navigation

- [ ] **7.1.1** Tab to ChipSelector: verify chips are focusable in sequence
- [ ] **7.1.2** Use Arrow keys to navigate between chips
- [ ] **7.1.3** Press Enter/Space to select a chip
- [ ] **7.1.4** Tab to DiaSection headers: verify focus ring appears
- [ ] **7.1.5** Press Enter/Space to toggle expand/collapse
- [ ] **7.1.6** Tab through EjercicioRow inputs: verify logical order

### 7.2 Screen Reader Verification

- [ ] **7.2.1** Verify ChipSelector has proper role and label
- [ ] **7.2.2** Verify DiaSection announces expand/collapse state
- [ ] **7.2.3** Verify form labels are associated with inputs

---

## Dependency Graph

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
Phase 5 (Button Styling)
       │
       ▼
Phase 6 (Integration)
       │
       ▼
Phase 7 (Accessibility)
```

---

## File Changes Summary

| File | Change Type | Lines Approx |
|------|------------|--------------|
| `src/app/globals.css` | Modified | +40 tokens |
| `src/components/admin/chip-selector.tsx` | **NEW** | ~120 |
| `src/components/admin/dia-section.tsx` | Modified | +80 |
| `src/components/admin/ejercicio-row.tsx` | Modified | +50 |
| `src/components/admin/rutina-completa-form.tsx` | Modified | +60 |

---

## Acceptance Criteria Summary

| ID | Criterion | Phase |
|----|-----------|-------|
| RCU1 | Days collapsed by default (Day 1 expanded) | 3.3 |
| RCU2 | Placeholders descriptive and theme-appropriate | 4.2 |
| RCU3 | Chip selection requires no dropdown click | 2.2 |
| RCU4 | Micro-interactions provide smooth feedback | 2.1, 3.1 |
| RCU5 | Error states visible in both themes | 4.4 |
| RCU6 | Submit button solid white in dark mode | 5.1 |
| RCU7 | + Agregar Día is outline style | 5.2 |
| RCU8 | + Agregar Ejercicio is discrete | 5.3 |
| RCU9 | Maximum 7 days enforced | 3.4 |
| RCU10 | All colors use CSS variables | 1.1, 1.2 |
