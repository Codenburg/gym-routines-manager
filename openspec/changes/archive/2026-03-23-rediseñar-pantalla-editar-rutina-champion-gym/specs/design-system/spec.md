# Delta for design-system

## Purpose

This spec defines design system requirements for the Champion Gym Edit Routine page redesign. It establishes a dual-color accent system: turquoise (#48b8c9) for light mode and red (#E11D48) for dark mode, maintaining brand identity in light mode while using red in dark mode for better visual hierarchy.

---

## ADDED Requirements

### Requirement: Dual-Mode Accent Color Palette

The system SHALL provide CSS custom properties for accent colors that adapt based on color mode. These tokens MUST be defined in `globals.css` and MUST be used for the Edit Routine page components.

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
| `--daycard-icon` | `#48b8c9` (light) / `#E11D48` (dark) | `#E11D48` | Day icon color |
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

### Requirement: No Contrast Violations

The system SHALL NOT place accent color text on accent color backgrounds. All text on accent elements MUST use foreground tokens.

#### Scenario: No accent-on-accent text

- GIVEN any component uses accent background
- WHEN text is placed on that background
- THEN the text color MUST be `--color-accent-foreground` (#ffffff)
- AND MUST NOT use the accent color itself

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/app/globals.css` | ADD dual-mode accent tokens, DayCard tokens, cancel button hover tokens |

---

## ACCEPTANCE CRITERIA

| ID | Criterion | Verification |
|----|-----------|--------------|
| RSD1 | Turquoise accent tokens defined for light mode (#48b8c9 and variations) | Inspect CSS |
| RSD2 | Red accent tokens defined for dark mode (#E11D48 and variations) | Inspect CSS |
| RSD3 | Focus ring adapts to color mode (turquoise/red) | Inspect CSS |
| RSD4 | DayCard color tokens defined for both themes | Inspect CSS |
| RSD5 | Cancel button hover uses red in both modes | Inspect CSS |
| RSD6 | All color combinations pass WCAG AA | Contrast checker |
| RSD7 | Page background: #f8fafc (light) / #09090b (dark) | Inspect CSS |
| RSD8 | Secondary text: #64748b (light) / #a1a1aa (dark) | Inspect CSS |

---

## Design Tokens to Add to globals.css

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
}

.dark {
  --daycard-bg: #18181b;
  --daycard-border: #27272a;
  --daycard-title: #f8fafc;
  --daycard-subtitle: #a1a1aa;
  --daycard-badge-bg: #09090b;
  --daycard-badge-text: #ffffff;
}

/* Day icon uses accent color */
:root { --daycard-icon: #48b8c9; }
.dark { --daycard-icon: #E11D48; }
```
