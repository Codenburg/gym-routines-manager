# Delta for components

## Purpose

This spec defines component-level requirements for the Champion Gym Edit Routine page redesign. It introduces `SegmentedControl` and `RoutineDayCard` as new components, and modifies `RutinaForm` and `DiaManager` to use a red accent (#E11D48) and responsive grid layout.

---

## ADDED Requirements

### Requirement: SegmentedControl Component

The SegmentedControl component SHALL allow users to select a single routine type from a list of options, replacing the current `ChipSelector`/dropdown pattern on the Edit Routine page.

#### SegmentedControl Props Interface

```typescript
interface SegmentedControlProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  disabled?: boolean;
  accentColor?: string; // Defaults to #E11D48
}
```

#### SegmentedControl Visual States

| State | Dark Mode | Light Mode |
|-------|-----------|------------|
| Default (unselected) | Border `#27272a`, text `#9ca3af` | Border `#e2e8f0`, text `#6b7280` |
| Hover | Border `#E11D48`, text `#f8fafc` | Border `#E11D48`, text `#111827` |
| Selected | Background `#E11D48`, text `#ffffff` | Background `#E11D48`, text `#ffffff` |
| Disabled | Opacity 50%, cursor not-allowed | Opacity 50%, cursor not-allowed |

#### SegmentedControl Responsive Behavior

| Viewport | Layout |
|----------|--------|
| Mobile (<768px) | `flex-wrap` with `gap-2` |
| Tablet+ (md+) | Single row, no wrap |

#### Scenario: Selecting a routine type in dark mode

- GIVEN a user in dark mode views the SegmentedControl
- WHEN they click on "Hipertrofia" pill
- THEN the pill MUST have `#E11D48` background
- AND text MUST be `#ffffff`
- AND previous selection MUST be deselected

#### Scenario: Selecting a routine type in light mode

- GIVEN a user in light mode views the SegmentedControl
- WHEN they click on "Cardio" pill
- THEN the pill MUST have `#E11D48` background
- AND text MUST be `#ffffff`
- AND previous selection MUST be deselected

#### Scenario: Mobile flex-wrap behavior

- GIVEN a user on mobile (<768px) views the SegmentedControl with "Hipertrofia" option
- WHEN the options render
- THEN the pills MUST wrap to multiple lines if needed
- AND "Hipertrofia" text MUST NOT break the layout
- AND each pill has minimum width allowing text growth

#### Scenario: Keyboard navigation

- GIVEN a user navigates via Tab key
- WHEN focus lands on a pill
- THEN a visible focus ring MUST appear using `0 0 0 2px #E11D48`
- AND Enter/Space keys MUST trigger selection

#### Scenario: Hover feedback

- GIVEN a user hovers over an unselected pill
- WHEN the hover occurs
- THEN the border MUST change to `#E11D48`
- AND the text color MUST change accordingly

---

### Requirement: RoutineDayCard Component

The RoutineDayCard component SHALL display a training day as a clickable card in the responsive grid. It shows day icon, name, focused muscles, and exercise count.

#### RoutineDayCard Props Interface

```typescript
interface RoutineDayCardProps {
  dia: {
    id: string;
    nombre: string;
    musculosEnfocados?: string;
    ejercicios: Array<{ id: string; nombre: string }>;
  };
  onClick: (diaId: string) => void;
  onDelete?: (diaId: string) => void;
  index: number;
}
```

#### RoutineDayCard Visual Design

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| Background | `#18181b` | `#ffffff` |
| Border | `#27272a` | `#e2e8f0` |
| Border radius | 12px - 16px | 12px - 16px |
| Icon | `#E11D48` | `#E11D48` |
| Day name | `#f8fafc` (font-weight 600) | `#111827` (font-weight 600) |
| Muscle text | `#9ca3af` | `#6b7280` |
| Exercise count badge | `#E11D48` border, `#ffffff` text | `#E11D48` border, `#111827` text |

#### RoutineDayCard Structure

```
┌─────────────────────────────────────┐
│  [🏋️ Icon]  Día {index + 1}        │
│                                     │
│  {nombre}                           │
│  {musculosEnfocados || "Sin definir"}│
│                                     │
│  [N ejercicios]                     │
└─────────────────────────────────────┘
```

#### Scenario: Rendering day card in dark mode

- GIVEN a day with nombre "Pierna" and 3 ejercicios exists
- WHEN the RoutineDayCard renders in dark mode
- THEN the card MUST have `#18181b` background
- AND icon MUST be `#E11D48`
- AND exercise count badge MUST show "3 ejercicios"

#### Scenario: Rendering day card in light mode

- GIVEN a day with nombre "Pecho" and 4 ejercicios exists
- WHEN the RoutineDayCard renders in light mode
- THEN the card MUST have `#ffffff` background
- AND subtle shadow `0 1px 3px rgba(0,0,0,0.1)`
- AND border `#e2e8f0`

#### Scenario: Clicking day card navigates to edit

- GIVEN a user views the RoutineDayCard
- WHEN they click on the card (excluding delete button)
- THEN `onClick(dia.id)` MUST be invoked
- AND the user SHOULD navigate to edit that day

#### Scenario: Deleting a day from card

- GIVEN a user clicks the delete icon on the RoutineDayCard
- WHEN the click occurs
- THEN `onDelete(dia.id)` MUST be invoked
- AND the card SHOULD be removed from the grid

#### Scenario: Empty muscle group display

- GIVEN a day has empty `musculosEnfocados`
- WHEN the RoutineDayCard renders
- THEN it MUST display "Sin definir" as placeholder text
- AND the text MUST use muted color

---

## MODIFIED Requirements

### Requirement: DiaManager Grid Layout (Modified from CollapsibleDiaSection)

The DiaManager component SHALL display days in a responsive grid instead of a flat vertical list. This replaces the `DiaSection` pattern used in creation form.

#### DiaManager Grid Configuration

| Viewport | Columns | Tailwind Class |
|----------|---------|----------------|
| Mobile (<768px) | 1 | `grid-cols-1` |
| Tablet (md: 768px+) | 2 | `md:grid-cols-2` |
| Desktop (lg: 1024px+) | 3 | `lg:grid-cols-3` |

#### Scenario: Day grid on mobile

- GIVEN a routine with 3 days exists
- WHEN the DiaManager renders on mobile viewport
- THEN the days MUST display in a single column
- AND each card MUST use full available width

#### Scenario: Day grid on tablet

- GIVEN a routine with 4 days exists
- WHEN the DiaManager renders on tablet viewport (768px+)
- THEN the days MUST display in 2 columns
- AND cards MUST have equal width within the grid

#### Scenario: Day grid on desktop

- GIVEN a routine with 6 days exists
- WHEN the DiaManager renders on desktop viewport (1024px+)
- THEN the days MUST display in 3 columns
- AND cards MUST fill the available space evenly

#### Scenario: Adding a new day to grid

- GIVEN a user clicks to add a new day
- WHEN the day is created
- THEN the new RoutineDayCard MUST appear in the grid
- AND the grid MUST reflow to accommodate the new card

#### Scenario: Deleting a day from grid

- GIVEN the grid displays 3 days
- WHEN a user deletes a day
- THEN the card MUST be removed from the grid
- AND remaining cards MUST reflow to fill gaps

---

### Requirement: RutinaForm Layout (Modified)

The RutinaForm component SHALL be refactored to use SegmentedControl for type selection and follow a cleaner two-section layout.

#### RutinaForm Structure

```
┌─────────────────────────────────────────┐
│  AdminCard: Detalles de Rutina          │
│  ┌─────────────────────────────────────┐ │
│  │ [Nombre input]                      │ │
│  │ [SegmentedControl - Tipo]           │ │
│  │ [Textarea - Descripción]            │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  AdminCard: Días de Entrenamiento       │
│  ┌─────────────────────────────────────┐ │
│  │ [DiaManager with RoutineDayCards]    │ │
│  │ [+ Agregar Día button]              │ │
│  └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│  [Cancelar]           [Actualizar (🔴)] │
└─────────────────────────────────────────┘
```

#### RutinaForm Submit Button

| State | Style |
|-------|-------|
| Default | Background `#E11D48`, text `#ffffff` |
| Hover | Background `#be123c` (darker red) |
| Disabled | Opacity 50%, cursor not-allowed |
| Loading | Shows spinner, text "Actualizando..." |

#### Scenario: Submit button uses red accent

- GIVEN a user views the "Actualizar Rutina" button
- WHEN the button renders
- THEN it MUST have `#E11D48` background
- AND white text `#ffffff`

#### Scenario: Form cancel navigates back

- GIVEN a user clicks "Cancelar"
- THEN the user MUST be navigated to the routines list

---

## REMOVED Requirements

### Requirement: ChipSelector for Type Selection (Removed from Edit page)

(Reason: The Edit Routine page now uses SegmentedControl which provides better UX for mobile with flex-wrap behavior. ChipSelector may still be used in creation form.)

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/components/admin/segmented-control.tsx` | **NEW** - SegmentedControl component |
| `src/components/admin/routine-day-card.tsx` | **NEW** - RoutineDayCard component |
| `src/components/admin/rutina-form.tsx` | MODIFY - Use SegmentedControl, red accent button |
| `src/components/admin/dia-manager.tsx` | MODIFY - Replace DiaSection list with grid layout |

---

## ACCEPTANCE CRITERIA

| ID | Criterion | Verification |
|----|-----------|--------------|
| CRC1 | SegmentedControl renders with all routine types | Visual inspection |
| CRC2 | SegmentedControl selection works in both themes | Visual inspection |
| CRC3 | SegmentedControl flex-wrap works on mobile | Resize viewport test |
| CRC4 | SegmentedControl keyboard navigation functional | Keyboard test |
| CRC5 | RoutineDayCard displays icon, name, muscles, count | Visual inspection |
| CRC6 | RoutineDayCard clickable to edit day | Click test |
| CRC7 | DiaManager grid: 1 col mobile, 2 col tablet, 3 col desktop | Responsive test |
| CRC8 | DiaManager add/delete day updates grid | Functional test |
| CRC9 | "Actualizar Rutina" button uses #E11D48 background | Visual inspection |
| CRC10 | Cancel button navigates back | Navigation test |
| CRC11 | All components WCAG AA contrast compliant | Contrast checker |
| CRC12 | Focus indicators use red ring `0 0 0 2px #E11D48` | Keyboard navigation test |
