# Delta for components

## Purpose

This spec defines the component-level requirements for the routine creation UI redesign. It describes the behavior, states, and visual specifications for ChipSelector, CollapsibleDiaSection, and EjercicioRow components.

---

## ADDED Requirements

### Requirement: ChipSelector Component

The ChipSelector component SHALL allow users to select a single routine type from a list of options. It replaces the dropdown `<Select>` pattern with a more visible, click-friendly chip/pill interface.

#### ChipSelector Props Interface

```typescript
interface ChipSelectorProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}
```

#### ChipSelector States

| State | Light Mode | Dark Mode |
|-------|------------|-----------|
| Default (unselected) | Border `--color-border-light`, text `--color-text-secondary` | Border `--color-border-light`, text `--color-text-secondary` |
| Hover | Border `--color-accent`, text `--color-accent` | Border `--color-accent`, text `--color-accent` |
| Selected | Background `--color-accent`, text `--color-accent-foreground` | Border `--color-accent`, background `--color-accent`, text `--color-accent-foreground` |
| Disabled | Opacity 50%, cursor not-allowed | Opacity 50%, cursor not-allowed |

#### Scenario: Selecting a chip in light mode

- GIVEN a user in light mode views the routine type section
- WHEN they click on "Fuerza" chip
- THEN the chip MUST have `--color-accent` (#48b8c9) background
- AND text MUST be `--color-accent-foreground` (#ffffff)
- AND previous selection MUST be deselected

#### Scenario: Selecting a chip in dark mode

- GIVEN a user in dark mode views the routine type section
- WHEN they click on "Cardio" chip
- THEN the chip MUST have `--color-accent` border
- AND `--color-accent` background
- AND text MUST be `--color-accent-foreground` (#ffffff)

#### Scenario: Hover state feedback

- GIVEN a user hovers over an unselected chip
- WHEN the hover occurs
- THEN the border MUST change to `--color-accent`
- AND the text color MUST change to `--color-accent`

#### Scenario: Keyboard navigation

- GIVEN a user navigates via Tab key
- WHEN focus lands on a chip
- THEN a visible focus ring MUST appear using `--focus-ring`
- AND Enter/Space keys MUST trigger selection

#### Scenario: Disabled state

- GIVEN the ChipSelector has `disabled={true}`
- WHEN the component renders
- THEN all chips MUST have `opacity: 0.5`
- AND clicks MUST NOT trigger `onChange`

---

### Requirement: CollapsibleDiaSection Component

The CollapsibleDiaSection component SHALL display a single training day that can expand/collapse to show or hide its exercises. It reduces cognitive load by keeping the interface scannable.

#### CollapsibleDiaSection Props Interface

```typescript
interface DiaSectionProps {
  dia: Dia;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (dia: Dia) => void;
  onDelete: () => void;
}
```

#### CollapsibleDiaSection Visual States

##### Header (Collapsed)

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `--color-card` (#ffffff) | `--color-card` (#121212) |
| Border | `--color-border-light` | `--color-border-light` (#2a2a2a) |
| Border radius | 12px - 16px | 12px - 16px |
| Delete button | Icon only, `--color-text-secondary` | Icon only, `--color-text-secondary` |

##### Header (Expanded)

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `--color-card` (#ffffff) | `--color-card` (#121212) |
| Border | `--color-border-light` | `--color-border-light` (#2a2a2a) |
| Chevron rotation | 90deg (pointing down) | 90deg (pointing down) |
| Delete button visible | Yes | Yes (and collapse button) |

#### Scenario: Collapsing a day section

- GIVEN a user views an expanded DiaSection
- WHEN they click on the header or chevron
- THEN the section MUST collapse
- AND the exercises list MUST be hidden
- AND the chevron MUST rotate to point right (0deg)

#### Scenario: Expanding a day section

- GIVEN a user views a collapsed DiaSection
- WHEN they click on the header or chevron
- THEN the section MUST expand
- AND the exercises list MUST be visible
- AND the chevron MUST rotate to point down (90deg)

#### Scenario: Deleting a day

- GIVEN a user clicks the delete icon on a DiaSection
- WHEN the delete action is confirmed (if needed)
- THEN `onDelete` callback MUST be invoked
- AND the day MUST be removed from the form state

#### Scenario: Dark mode card style

- GIVEN a user in dark mode views a DiaSection
- WHEN the section renders
- THEN the card background MUST be `--color-card` (#121212)
- AND border MUST be `--color-border-light` (#2a2a2a)
- AND border radius MUST be 12px-16px
- AND shadow MUST be subtle: `0 1px 3px rgba(0,0,0,0.3)`

#### Scenario: Chevron animation

- GIVEN a user toggles a DiaSection
- WHEN the expand/collapse occurs
- THEN the chevron rotation MUST animate smoothly (150-200ms transition)

---

### Requirement: EjercicioRow Component

The EjercicioRow component SHALL display a single exercise with horizontal layout `[Nombre] [Series] x [Repeticiones] [Delete]`. It MUST be ultra-slim with minimal visual weight.

#### EjercicioRow Props Interface

```typescript
interface EjercicioRowProps {
  ejercicio: Ejercicio;
  onUpdate: (ejercicio: Ejercicio) => void;
  onDelete: () => void;
}
```

#### EjercicioRow Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [Nombre输入框....................]  [3]  x  [10]            [🗑] │
│   Placeholder: "Ej: Sentadillas con barra"                        │
└──────────────────────────────────────────────────────────────────┘
```

| Field | Width | Behavior |
|-------|-------|----------|
| Nombre | Flexible (flex-1) | Text input, placeholder required |
| Series | Fixed (w-16) | Number input, min 1 |
| Repeticiones | Fixed (w-16) | Number input, min 1 |
| Delete | Fixed | Icon button |

#### EjercicioRow Visual States

##### Light Mode

| Element | Style |
|---------|-------|
| Container | Horizontal flex, gap 12px, align-center |
| Input borders | 1px `--color-border-light` |
| Border radius | 8px - 12px |
| Placeholder | `--color-text-secondary`, descriptive text |
| Delete icon | `--color-text-secondary`, hover `--color-error` |

##### Dark Mode (Ultra-Slim)

| Element | Style |
|---------|-------|
| Container | Horizontal flex, gap 12px, align-center |
| Input background | Slightly lighter than card: `#2a2a2a` on `#121212` |
| Input border | None or very subtle `#2a2a2a` |
| Border radius | 8px - 12px |
| Placeholder | `--color-placeholder` (#6b7280), descriptive |
| Delete icon | `--color-text-secondary`, hover `--color-error` |

#### Scenario: Rendering exercise row in light mode

- GIVEN an exercise exists in a day
- WHEN the EjercicioRow renders in light mode
- THEN the layout MUST be horizontal: `[Nombre] [3] x [10] [🗑]`
- AND the placeholder for Nombre MUST be descriptive: "Ej: Sentadillas con barra"

#### Scenario: Rendering exercise row in dark mode

- GIVEN an exercise exists in a day
- WHEN the EjercicioRow renders in dark mode
- THEN inputs MUST have `#2a2a2a` background on `#121212` card
- AND placeholder text MUST be `--color-placeholder` (#6b7280)

#### Scenario: Updating exercise name

- GIVEN a user types in the Nombre input
- WHEN the value changes
- THEN `onUpdate` MUST be called with the updated ejercicio object
- AND the input MUST reflect the new value

#### Scenario: Updating series/reps

- GIVEN a user changes the series count
- WHEN the value changes
- THEN `onUpdate` MUST be called with the updated ejercicio
- AND the number MUST be validated (min 1)

#### Scenario: Deleting an exercise

- GIVEN a user clicks the delete icon
- WHEN the click occurs
- THEN `onDelete` MUST be called
- AND the row MUST be removed from the list

#### Scenario: Error state in dark mode

- GIVEN an input has a validation error
- WHEN the error displays in dark mode
- THEN the border MUST use `--color-error` (#ef4444)
- AND the error border MUST be subtle (not overwhelming)

---

### Requirement: Form Header with Submit Button

The routine creation form SHALL have a header area containing the type selector and a prominent "Crear Rutina" submit button positioned in the upper right corner.

#### Scenario: Submit button position in dark mode

- GIVEN a user in dark mode views the routine form
- WHEN the "Crear Rutina" button renders
- THEN it MUST be positioned in the upper right corner
- AND it MUST have solid white background (#ffffff)
- AND text MUST be black (#0a0a0a)
- AND border-radius MUST be 12px

#### Scenario: Submit button position in light mode

- GIVEN a user in light mode views the routine form
- WHEN the "Crear Rutina" button renders
- THEN it SHOULD be positioned in the upper right corner or prominent location

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/components/admin/chip-selector.tsx` | **NEW** - ChipSelector component |
| `src/components/admin/dia-section.tsx` | MODIFY - Add collapsible behavior |
| `src/components/admin/ejercicio-row.tsx` | MODIFY - Horizontal layout, ultra-slim dark mode |
| `src/components/admin/rutina-completa-form.tsx` | MODIFY - Integrate new components |

---

## ACCEPTANCE CRITERIA

| ID | Criterion | Verification |
|----|-----------|--------------|
| RCC1 | ChipSelector renders with all states (default, hover, selected, disabled) | Unit test + visual |
| RCC2 | ChipSelector selection works in both light/dark modes | Visual inspection |
| RCC3 | ChipSelector keyboard navigation functional | Keyboard test |
| RCC4 | DiaSection collapses/expands with animation | Visual inspection |
| RCC5 | DiaSection delete triggers callback | Unit test |
| RCC6 | EjercicioRow has horizontal layout `[Nombre] [Series] x [Repeticiones]` | Visual inspection |
| RCC7 | EjercicioRow placeholders are descriptive | Visual inspection |
| RCC8 | EjercicioRow dark mode is ultra-slim | Visual inspection |
| RCC9 | Submit button positioned correctly in upper right | Visual inspection |
| RCC10 | All components use semantic tokens from design-system | ESLint grep |
