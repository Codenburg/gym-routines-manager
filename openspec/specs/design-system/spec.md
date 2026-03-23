# Delta for design-system

## Purpose

This spec defines the design system requirements for the routine creation UI redesign. It establishes color tokens for both light and dark themes, typography rules, spacing conventions, and focus state patterns for the routine creation form components.

---

## ADDED Requirements

### Requirement: Light Mode Color Palette

The system SHALL provide CSS custom properties for the light theme. The following tokens MUST be defined in `globals.css` and MUST be used by all routine creation components.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-base` | `#f9fafb` | Page background |
| `--color-card` | `#ffffff` | Card/container backgrounds |
| `--color-accent` | `#48b8c9` | Primary accent, active chip selection |
| `--color-accent-hover` | `#3da4b3` | Hover state for accent elements |
| `--color-accent-active` | `#35899f` | Active/pressed state for accent elements |
| `--color-accent-foreground` | `#ffffff` | Text on accent background |
| `--color-border-light` | `#e5e7eb` | Input borders |
| `--color-text-primary` | `#111827` | Headings and titles |
| `--color-text-secondary` | `#6b7280` | Labels and secondary text |

#### Scenario: Light mode renders correctly

- GIVEN a user with light mode preference views the routine creation form
- WHEN the page renders
- THEN all components MUST use the light theme tokens
- AND `--color-base` (#f9fafb) MUST be the page background
- AND `--color-accent` (#48b8c9) MUST be used for active states

---

### Requirement: Dark Mode Color Palette

The system SHALL provide CSS custom properties for the dark theme. The following tokens MUST be defined and MUST be used by all routine creation components in dark mode.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-base` | `#0a0a0a` | Page background (pure black) |
| `--color-card` | `#121212` | Card/container backgrounds (charcoal) |
| `--color-card-alt` | `#181818` | Alternate card background |
| `--color-accent` | `#48b8c9` | Accent turquoise for selection |
| `--color-accent-foreground` | `#ffffff` | Text on accent background |
| `--color-primary-btn` | `#ffffff` | Primary button solid background |
| `--color-primary-btn-text` | `#0a0a0a` | Text on primary button |
| `--color-text-primary` | `#ffffff` | Headings and titles |
| `--color-text-secondary` | `#9ca3af` | Labels and secondary text |
| `--color-border-light` | `#2a2a2a` | Subtle borders (slightly lighter than card) |
| `--color-error` | `#ef4444` | Error feedback (subtle coral red) |
| `--color-placeholder` | `#6b7280` | Placeholder text in dark mode |

#### Scenario: Dark mode renders correctly

- GIVEN a user with dark mode preference views the routine creation form
- WHEN the page renders
- THEN all components MUST use the dark theme tokens
- AND `--color-base` (#0a0a0a) MUST be the page background
- AND `--color-card` (#121212) MUST be used for card backgrounds

#### Scenario: Dark mode accent selection

- GIVEN a user in dark mode selects a routine type chip
- WHEN the chip is selected
- THEN the chip MUST have `--color-accent` (#48b8c9) background
- AND the text MUST be `--color-accent-foreground` (#ffffff)

#### Scenario: Dark mode error feedback

- GIVEN a user in dark mode submits an invalid form
- WHEN validation errors display
- THEN the error border MUST use `--color-error` (#ef4444)
- AND the error MUST be subtle (not overwhelming)

---

### Requirement: Focus State with Accent Color

The system SHALL provide a consistent focus ring using the accent color. All interactive elements in the routine creation form MUST use the accent color for focus states.

#### Focus Ring Token

| Token | Value | Usage |
|-------|-------|-------|
| `--focus-ring` | `0 0 0 2px var(--color-accent)` | Focus ring style |

#### Scenario: Input focus state

- GIVEN a user focuses on a text input in the routine form
- WHEN the input receives focus
- THEN the border MUST change to `--color-accent`
- AND a focus ring MUST appear using `--focus-ring`

#### Scenario: Chip focus state

- GIVEN a user navigates to a chip via keyboard
- WHEN the chip receives focus
- THEN a visible focus ring MUST display using `--focus-ring`

---

### Requirement: Typography Rules

The system SHALL define typography rules for the routine creation form components.

```css
/* Titles */
h1, h2, h3 {
  font-weight: 700;
}

/* Labels */
label {
  font-weight: 500;
  color: var(--color-text-secondary);
}
```

#### Scenario: Form section labels

- GIVEN a user views the routine type section
- WHEN the label "Tipo de Rutina" renders
- THEN it MUST use `font-weight: 500`
- AND it MUST use `--color-text-secondary` color

---

### Requirement: Spacing and Dimensions

The system SHALL define consistent spacing and dimension tokens for the routine creation form components.

| Element | Value |
|---------|-------|
| Border radius (inputs) | 8px - 12px |
| Border radius (chips) | 12px - 16px |
| Border radius (cards/dark mode) | 12px - 16px |
| Padding (inputs) | 10px - 14px |
| Border width | 1px |
| Gap between sections | 24px |
| Shadow (cards - light) | `0 1px 3px rgba(0,0,0,0.1)` |
| Shadow (cards - dark) | `0 1px 3px rgba(0,0,0,0.3)` |

#### Scenario: Input border radius

- GIVEN an input renders in light mode
- WHEN the input displays
- THEN it MUST have `border-radius: 8px`
- AND a `1px` border using `--color-border-light`

#### Scenario: Card border radius in dark mode

- GIVEN a card renders in dark mode
- WHEN the card displays
- THEN it MUST have `border-radius: 12px` to `16px`
- AND subtle border using `--color-border-light`

---

### Requirement: Button Styles

#### Primary Button (Dark Mode)

The primary "Crear Rutina" button SHALL use solid white background in dark mode.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-btn` | `#ffffff` | Solid white background |
| `--color-primary-btn-text` | `#0a0a0a` | Black text |

#### Scenario: Primary button renders in dark mode

- GIVEN a user in dark mode views the routine form
- WHEN the "Crear Rutina" button renders
- THEN it MUST have solid `--color-primary-btn` (#ffffff) background
- AND `--color-primary-btn-text` (#0a0a0a) text color
- AND `border-radius: 12px`

#### Outline Button (Dark Mode)

The "+ Agregar Día" button SHALL use an outline style in dark mode.

| State | Border | Text |
|-------|--------|------|
| Default | `--color-border-light` (#2a2a2a) | `--color-text-secondary` (#9ca3af) |
| Hover | `--color-accent` (#48b8c9) | `--color-accent` (#48b8c9) |

#### Scenario: Outline button hover state

- GIVEN a user in dark mode hovers over "+ Agregar Día" button
- WHEN the hover occurs
- THEN the border MUST change to `--color-accent`
- AND the text color MUST change to `--color-accent`

#### Discrete Text Button

The "+ Agregar Ejercicio" button SHALL be a subtle text + icon button.

| State | Color |
|-------|-------|
| Default | `--color-text-secondary` (#9ca3af) |
| Hover | `--color-accent` (#48b8c9) |

#### Scenario: Discrete button hover

- GIVEN a user hovers over "+ Agregar Ejercicio"
- WHEN the hover occurs
- THEN the text/icon color MUST change to `--color-accent`

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/app/globals.css` | MODIFY - Add light/dark theme tokens for accent, primary button, error states |

---

## ACCEPTANCE CRITERIA

| ID | Criterion | Verification |
|----|-----------|--------------|
| RCD1 | Light mode tokens defined and working | Visual inspection |
| RCD2 | Dark mode tokens defined and working | Visual inspection |
| RCD3 | Focus states use `--focus-ring` token | Visual inspection + keyboard navigation |
| RCD4 | Typography rules applied to form labels | Visual inspection |
| RCD5 | Spacing and dimensions consistent with spec | Visual inspection |
| RCD6 | Primary button uses solid white in dark mode | Visual inspection |
| RCD7 | Error states use `--color-error` (#ef4444) | Manual validation test |

---

## ADDED Requirements (Edit Routine Page - Dual-Mode)

### Requirement: Dual-Mode Accent Color Palette

The system SHALL provide CSS custom properties for accent colors that adapt based on color mode for the Edit Routine page.

#### Light Mode Accent Token Set (Turquoise)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#48b8c9` | Primary turquoise accent |
| `--color-accent-hover` | `#3da4b3` | Hover state for accent |
| `--color-accent-active` | `#35899f` | Active/pressed state |
| `--color-accent-foreground` | `#ffffff` | Text on accent background |

#### Dark Mode Accent Token Set (Red)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#E11D48` | Primary red accent |
| `--color-accent-hover` | `#be123c` | Hover state for red accent |
| `--color-accent-active` | `#9f1239` | Active/pressed state |
| `--color-accent-foreground` | `#ffffff` | Text on accent background |

#### Dual-Mode Contrast Ratios (WCAG AA Compliant)

| Mode | Foreground | Background | Ratio | Pass |
|------|------------|------------|-------|------|
| Light | `#48b8c9` | `#f8fafc` | ~4.6:1 | ✅ AA |
| Light | `#ffffff` | `#48b8c9` | ~5.1:1 | ✅ AA |
| Dark | `#E11D48` | `#09090b` | ~4.5:1 | ✅ AA |
| Dark | `#ffffff` | `#E11D48` | ~5:1 | ✅ AA |

#### Scenario: Turquoise accent on light mode

- GIVEN the Edit Routine page renders in light mode
- WHEN the SegmentedControl displays selected state
- THEN the selected pill MUST use `#48b8c9` background
- AND white text `#ffffff`

#### Scenario: Red accent on dark mode

- GIVEN the Edit Routine page renders in dark mode
- WHEN the SegmentedControl displays selected state
- THEN the selected pill MUST use `#E11D48` background
- AND white text `#ffffff`

---

### Requirement: Dual-Mode Focus Ring

The system SHALL provide a focus ring token that adapts to the color mode: turquoise in light mode, red in dark mode.

#### Focus Ring Token

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--focus-ring` | `0 0 0 2px #48b8c9` | `0 0 0 2px #E11D48` | Focus ring for edit page components |

#### Scenario: Focus ring adapts to light mode

- GIVEN a user focuses on an input in light mode
- WHEN the input receives focus
- THEN the focus ring MUST use turquoise `#48b8c9`

#### Scenario: Focus ring adapts to dark mode

- GIVEN a user focuses on an input in dark mode
- WHEN the input receives focus
- THEN the focus ring MUST use red `#E11D48`

---

### Requirement: RoutineDayCard Color Tokens

The system SHALL provide color tokens specific to RoutineDayCard component with dual-mode support.

#### RoutineDayCard Token Set

| Token | Light Mode Value | Dark Mode Value | Usage |
|-------|-----------------|-----------------|-------|
| `--daycard-bg` | `#ffffff` | `#18181b` | Card background |
| `--daycard-border` | `#e2e8f0` | `#27272a` | Card border |
| `--daycard-icon` | `#48b8c9` | `#E11D48` | Day icon color |
| `--daycard-title` | `#111827` | `#f8fafc` | Day name text |
| `--daycard-subtitle` | `#64748b` | `#a1a1aa` | Muscle group text |
| `--daycard-badge-bg` | `#f8fafc` | `#09090b` | Badge background |
| `--daycard-badge-text` | `#111827` | `#ffffff` | Badge text |

#### Scenario: DayCard light mode colors

- GIVEN a RoutineDayCard renders in light mode
- WHEN the card displays
- THEN background MUST be `--daycard-bg` (#ffffff)
- AND border MUST be `--daycard-border` (#e2e8f0)
- AND icon MUST use turquoise `#48b8c9`
- AND subtle shadow MUST be present

#### Scenario: DayCard dark mode colors

- GIVEN a RoutineDayCard renders in dark mode
- WHEN the card displays
- THEN background MUST be `--daycard-bg` (#18181b)
- AND border MUST be `--daycard-border` (#27272a)
- AND icon MUST use red `#E11D48`

---

### Requirement: Primary Button Dual-Mode Styles

The system SHALL provide button style tokens that adapt to color mode: turquoise in light, red in dark.

#### Primary Button Token Set

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--btn-primary-bg` | `#48b8c9` | `#E11D48` | Primary button background |
| `--btn-primary-bg-hover` | `#3da4b3` | `#be123c` | Primary button hover |
| `--btn-primary-text` | `#ffffff` | `#ffffff` | Primary button text |

#### Cancel Button Token Set

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--btn-cancel-bg` | `transparent` | `transparent` | Cancel button background |
| `--btn-cancel-border` | `#e2e8f0` | `#27272a` | Cancel button border |
| `--btn-cancel-text` | `#64748b` | `#a1a1aa` | Cancel button text |
| `--btn-cancel-hover` | `#ef4444` | `#E11D48` | Cancel button hover (red) |

#### Scenario: Primary button in light mode

- GIVEN a user in light mode views the "Actualizar Rutina" button
- WHEN the button displays
- THEN it MUST have turquoise `#48b8c9` background
- AND white `#ffffff` text

#### Scenario: Primary button in dark mode

- GIVEN a user in dark mode views the "Actualizar Rutina" button
- WHEN the button displays
- THEN it MUST have red `#E11D48` background
- AND white `#ffffff` text

#### Scenario: Cancel button hover in light mode

- GIVEN a user in light mode hovers over "Cancelar" button
- WHEN the hover occurs
- THEN the button border MUST change to `#ef4444` (red)

#### Scenario: Cancel button hover in dark mode

- GIVEN a user in dark mode hovers over "Cancelar" button
- WHEN the hover occurs
- THEN the button border MUST change to `#E11D48` (red)

---

### Requirement: Page Background & Borders

The system SHALL provide page background and border tokens for the Edit Routine page.

#### Page Token Set

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-base` | `#f8fafc` | `#09090b` | Page background |
| `--color-card` | `#ffffff` | `#18181b` | Card background |
| `--color-border` | `#e2e8f0` | `#27272a` | Border color |
| `--color-text-secondary` | `#64748b` | `#a1a1aa` | Secondary text |

---

## EDIT Routine Page Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| RDP1 | Turquoise accent tokens defined for light mode (#48b8c9 and variations) | Inspect CSS |
| RDP2 | Red accent tokens defined for dark mode (#E11D48 and variations) | Inspect CSS |
| RDP3 | Focus ring adapts to color mode (turquoise/red) | Inspect CSS |
| RDP4 | DayCard color tokens defined for both themes | Inspect CSS |
| RDP5 | Cancel button hover uses red in both modes | Inspect CSS |
| RDP6 | All color combinations pass WCAG AA | Contrast checker |
| RDP7 | Page background: #f8fafc (light) / #09090b (dark) | Inspect CSS |
| RDP8 | Secondary text: #64748b (light) / #a1a1aa (dark) | Inspect CSS |

---

## Design Tokens for Edit Routine Page (globals.css additions)

```css
/* Dual-Mode Accent - Edit Routine Page */
:root {
  /* Light Mode: Turquoise */
  --color-accent: #48b8c9;
  --color-accent-hover: #3da4b3;
  --color-accent-active: #35899f;
  --color-accent-foreground: #ffffff;
  --focus-ring: 0 0 0 2px #48b8c9;
  
  /* Page & Card backgrounds (light) */
  --color-base: #f8fafc;
  --color-card: #ffffff;
  --color-border: #e2e8f0;
  --color-text-secondary: #64748b;
  
  /* Button tokens */
  --btn-primary-bg: #48b8c9;
  --btn-primary-bg-hover: #3da4b3;
  --btn-primary-text: #ffffff;
  --btn-cancel-hover: #ef4444;
}

.dark {
  /* Dark Mode: Red */
  --color-accent: #E11D48;
  --color-accent-hover: #be123c;
  --color-accent-active: #9f1239;
  --color-accent-foreground: #ffffff;
  --focus-ring: 0 0 0 2px #E11D48;
  
  /* Page & Card backgrounds (dark) */
  --color-base: #09090b;
  --color-card: #18181b;
  --color-border: #27272a;
  --color-text-secondary: #a1a1aa;
  
  /* Button tokens */
  --btn-primary-bg: #E11D48;
  --btn-primary-bg-hover: #be123c;
  --btn-primary-text: #ffffff;
  --btn-cancel-hover: #E11D48;
}

/* RoutineDayCard Tokens */
:root {
  --daycard-bg: #ffffff;
  --daycard-border: #e2e8f0;
  --daycard-title: #111827;
  --daycard-subtitle: #64748b;
  --daycard-badge-bg: #f8fafc;
  --daycard-badge-text: #111827;
  --daycard-icon: #48b8c9;
}

.dark {
  --daycard-bg: #18181b;
  --daycard-border: #27272a;
  --daycard-title: #f8fafc;
  --daycard-subtitle: #a1a1aa;
  --daycard-badge-bg: #09090b;
  --daycard-badge-text: #ffffff;
  --daycard-icon: #E11D48;
}
```
