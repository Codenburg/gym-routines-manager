# Specification: Dark Mode with Mist Theme and Lucide Icons

## Purpose

This specification defines the dark/light mode theming system with the Mist theme (zinc palette), Zustand state management, and lucide-react icon replacement.

---

## Requirements

### Requirement: Dark/Light Mode Toggle

The system MUST provide a toggle to switch between dark and light themes.

#### Scenario: Toggle theme via button

- GIVEN the user clicks the ThemeToggle button
- WHEN the button is clicked
- THEN the theme MUST toggle between "dark" and "light"
- AND the new theme MUST persist in localStorage
- AND the UI MUST reflect the new theme immediately

---

### Requirement: Mist Theme Dark Palette

The dark theme MUST use the Mist zinc palette as specified.

The dark theme MUST define the following CSS variables:

| Variable | Value | Usage |
|----------|-------|-------|
| `--background` | `#09090b` | Page background |
| `--foreground` | `#fafafa` | Primary text |
| `--card` | `#18181b` | Card background |
| `--card-foreground` | `#fafafa` | Card text |
| `--popover` | `#18181b` | Popover background |
| `--popover-foreground` | `#fafafa` | Popover text |
| `--primary` | `#fafafa` | Primary actions |
| `--primary-foreground` | `#18181b` | Primary text on primary |
| `--secondary` | `#27272a` | Secondary elements |
| `--secondary-foreground` | `#fafafa` | Secondary text |
| `--muted` | `#27272a` | Muted backgrounds |
| `--muted-foreground` | `#a1a1aa` | Muted text |
| `--accent` | `#27272a` | Accent backgrounds |
| `--accent-foreground` | `#fafafa` | Accent text |
| `--destructive` | `#7f1d1d` | Destructive actions |
| `--destructive-foreground` | `#fafafa` | Destructive text |
| `--border` | `#27272a` | Border color |
| `--input` | `#27272a` | Input background |
| `--ring` | `#d4d4d8` | Focus ring |
| `--card-bg` | `#18181b` | Card component bg |
| `--card-border` | `#27272a` | Card component border |
| `--input-bg` | `#18181b` | Input component bg |
| `--input-border` | `#27272a` | Input component border |
| `--input-foreground` | `#fafafa` | Input text |
| `--input-placeholder` | `#71717a` | Input placeholder |
| `--button-primary-bg` | `#fafafa` | Primary button bg |
| `--button-primary-foreground` | `#18181b` | Primary button text |
| `--button-secondary-bg` | `#27272a` | Secondary button bg |
| `--button-secondary-foreground` | `#fafafa` | Secondary button text |
| `--button-secondary-border` | `#3f3f46` | Secondary button border |

#### Scenario: Dark theme renders correctly

- GIVEN the theme is set to "dark"
- WHEN the page renders
- THEN the background MUST be `#09090b`
- AND text MUST be `#fafafa`
- AND all CSS variables MUST match the specified dark values

---

### Requirement: Mist Theme Light Palette

The light theme MUST use the Mist zinc palette as specified.

The light theme MUST define the following CSS variables:

| Variable | Value | Usage |
|----------|-------|-------|
| `--background` | `#ffffff` | Page background |
| `--foreground` | `#18181b` | Primary text |
| `--card` | `#ffffff` | Card background |
| `--card-foreground` | `#18181b` | Card text |
| `--popover` | `#ffffff` | Popover background |
| `--popover-foreground` | `#18181b` | Popover text |
| `--primary` | `#18181b` | Primary actions |
| `--primary-foreground` | `#fafafa` | Primary text on primary |
| `--secondary` | `#f4f4f5` | Secondary elements |
| `--secondary-foreground` | `#18181b` | Secondary text |
| `--muted` | `#f4f4f5` | Muted backgrounds |
| `--muted-foreground` | `#71717a` | Muted text |
| `--accent` | `#f4f4f5` | Accent backgrounds |
| `--accent-foreground` | `#18181b` | Accent text |
| `--destructive` | `#fef2f2` | Destructive actions |
| `--destructive-foreground` | `#991b1b` | Destructive text |
| `--border` | `#e4e4e7` | Border color |
| `--input` | `#e4e4e7` | Input background |
| `--ring` | `#d4d4d8` | Focus ring |
| `--card-bg` | `#ffffff` | Card component bg |
| `--card-border` | `#e4e4e7` | Card component border |
| `--input-bg` | `#ffffff` | Input component bg |
| `--input-border` | `#e4e4e7` | Input component border |
| `--input-foreground` | `#18181b` | Input text |
| `--input-placeholder` | `#71717a` | Input placeholder |
| `--button-primary-bg` | `#18181b` | Primary button bg |
| `--button-primary-foreground` | `#fafafa` | Primary button text |
| `--button-secondary-bg` | `#f4f4f5` | Secondary button bg |
| `--button-secondary-foreground` | `#18181b` | Secondary button text |
| `--button-secondary-border` | `#d4d4d8` | Secondary button border |

#### Scenario: Light theme renders correctly

- GIVEN the theme is set to "light"
- WHEN the page renders
- THEN the background MUST be `#ffffff`
- AND text MUST be `#18181b`
- AND all CSS variables MUST match the specified light values

---

### Requirement: Theme Persistence

The theme MUST persist across browser sessions using localStorage.

#### Scenario: Theme persists after page reload

- GIVEN the user selects the "light" theme
- WHEN the user reloads the page
- THEN the theme MUST remain "light"
- AND the localStorage key "theme-storage" MUST contain the theme value

#### Scenario: Default theme is dark

- GIVEN a new user visits the site for the first time
- WHEN the page loads
- THEN the default theme MUST be "dark"

---

### Requirement: Theme Store with Zustand

The system MUST use Zustand for theme state management.

The theme store MUST:

- Export a `Theme` type with values "light" | "dark"
- Export a `useThemeStore` hook with:
  - `theme`: Current theme state
  - `toggleTheme()`: Action to toggle between themes
  - `setTheme(theme: Theme)`: Action to set specific theme
- Use Zustand's `persist` middleware with localStorage

#### Scenario: Theme store initialization

- GIVEN the application loads
- WHEN the theme store is created
- THEN the initial theme MUST be "dark"
- AND the store MUST persist to localStorage with key "theme-storage"

---

### Requirement: ThemeProvider Component

The system MUST provide a ThemeProvider component that synchronizes theme state with the HTML element.

The ThemeProvider MUST:

- Accept `children` as ReactNode prop
- Subscribe to the theme store
- Add the appropriate class ("dark" or "light") to `document.documentElement`
- Remove the opposite class before adding the new one

#### Scenario: ThemeProvider applies theme class

- GIVEN the theme is "dark"
- WHEN ThemeProvider renders
- THEN the `<html>` element MUST have class "dark"
- AND MUST NOT have class "light"

#### Scenario: ThemeProvider updates on theme change

- GIVEN the theme changes from "dark" to "light"
- WHEN the theme store updates
- THEN the `<html>` element MUST have class "light"
- AND MUST NOT have class "dark"

---

### Requirement: Anti-Flash Script

The application MUST include an anti-flash script to prevent flash of wrong theme on page load.

The script MUST:

- Execute before React hydration
- Read the theme from localStorage
- Apply the appropriate class to `<html>` immediately
- Handle errors gracefully

#### Scenario: Anti-flash prevents white flash in dark mode

- GIVEN the saved theme is "dark"
- WHEN the page loads (before React)
- THEN the `<html>` element MUST have class "dark"
- AND the page background MUST match dark theme

---

### Requirement: ThemeToggle Component

The system MUST provide a toggle button component.

The ThemeToggle MUST:

- Use lucide-react icons: Sun (for dark mode) and Moon (for light mode)
- Display Sun icon when current theme is "dark"
- Display Moon icon when current theme is "light"
- Call `toggleTheme()` on click
- Use CSS variable `--button-secondary-bg` for hover state
- Have accessible aria-label describing the action

#### Scenario: ThemeToggle shows correct icon for dark theme

- GIVEN the current theme is "dark"
- WHEN ThemeToggle renders
- THEN a Sun icon MUST be visible

#### Scenario: ThemeToggle shows correct icon for light theme

- GIVEN the current theme is "light"
- WHEN ThemeToggle renders
- THEN a Moon icon MUST be visible

---

### Requirement: Card Component Theme Support

The Card component MUST support theming via CSS variables.

The Card MUST use:

- `--card-bg` for background
- `--card-border` for border
- `--card-foreground` for text (Title component)
- `--muted` for Description text

#### Scenario: Card renders with dark theme variables

- GIVEN the theme is "dark"
- WHEN a Card renders
- THEN background MUST be `#18181b` (--card-bg)
- AND border MUST be `#27272a` (--card-border)

---

### Requirement: Button Component Theme Support

The Button component MUST support theming via CSS variables.

The Button MUST support variants:

- `primary`: Uses `--button-primary-bg` and `--button-primary-foreground`
- `secondary`: Uses `--button-secondary-bg`, `--button-secondary-foreground`, `--button-secondary-border`
- `danger`: Uses `--destructive` and `--destructive-foreground`
- `ghost`: Uses `--button-secondary-bg` for hover, `--muted` for text

All variants MUST use `--ring` for focus state.

#### Scenario: Primary button renders with dark theme

- GIVEN the theme is "dark" and button variant is "primary"
- WHEN the button renders
- THEN background MUST be `#fafafa`
- AND text MUST be `#18181b`

---

### Requirement: Input Component Theme Support

The Input component MUST support theming via CSS variables.

The Input MUST use:

- `--input-bg` for background
- `--input-border` for border
- `--input-foreground` for text
- `--input-placeholder` for placeholder
- `--button-secondary-border` for hover state

#### Scenario: Input renders with dark theme

- GIVEN the theme is "dark"
- WHEN an Input renders
- THEN background MUST be `#18181b`
- AND border MUST be `#27272a`
- AND text MUST be `#fafafa`
- AND placeholder MUST be `#71717a`

---

### Requirement: Textarea Component Theme Support

The Textarea component MUST support theming via CSS variables.

The Textarea MUST use the same CSS variables as Input:

- `--input-bg` for background
- `--input-border` for border
- `--input-foreground` for text
- `--input-placeholder` for placeholder

#### Scenario: Textarea renders with dark theme

- GIVEN the theme is "dark"
- WHEN a Textarea renders
- THEN background MUST be `#18181b`
- AND border MUST be `#27272a`
- AND text MUST be `#fafafa`

---

### Requirement: Roboto Font Integration

The application MUST use Roboto font via next/font/google.

The font MUST:

- Be loaded with weights 400, 500, 700
- Be available via CSS variable `--font-roboto`
- Be applied to the body element

#### Scenario: Roboto font is applied

- GIVEN the application loads
- WHEN the body renders
- THEN font-family MUST include `--font-roboto`

---

### Requirement: Lucide React Icons

The application MUST replace hardcoded SVG icons with lucide-react components.

#### Scenario: ThemeToggle uses lucide-react

- GIVEN the ThemeToggle component
- WHEN it renders
- THEN it MUST use `Sun` and `Moon` from "lucide-react"

---

## Technical Implementation

### File Structure

```
src/
├── app/
│   ├── globals.css          # CSS variables for theme
│   └── layout.tsx            # Font, ThemeProvider, anti-flash script
├── store/
│   └── theme-store.ts        # Zustand store with persistence
└── components/
    ├── theme-provider.tsx    # Theme synchronization
    ├── theme-toggle.tsx      # Toggle button
    └── ui/
        ├── card.tsx          # Card with theme variables
        ├── button.tsx        # Button with theme variables
        ├── input.tsx         # Input with theme variables
        └── textarea.tsx     # Textarea with theme variables
```

### Tailwind Integration

CSS variables are mapped to Tailwind theme via `@theme inline` block:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card-bg: var(--card-bg);
  --color-button-primary-bg: var(--button-primary-bg);
  /* ... etc */
}
```

---

## Acceptance Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC1 | Theme defaults to "dark" on first visit | Clear localStorage, reload, verify dark theme |
| AC2 | Clicking ThemeToggle switches theme | Click toggle, verify icon changes |
| AC3 | Theme persists after page reload | Set light theme, reload, verify light theme |
| AC4 | No flash of wrong theme on load | Check page load in Network tab, no white flash |
| AC5 | Card renders correctly in dark mode | Visual inspection, dark background |
| AC6 | Card renders correctly in light mode | Toggle to light, verify white background |
| AC7 | Button variants use correct theme colors | Test primary, secondary, danger, ghost |
| AC8 | Input/Textarea have correct colors in dark | Visual inspection of form fields |
| AC9 | Roboto font is applied | Check computed font-family |
| AC10 | ThemeToggle uses lucide-react icons | Check import statement |
| AC11 | No TypeScript errors | Run `npm run build` |
| AC12 | Production build succeeds | Run `npm run build` |
