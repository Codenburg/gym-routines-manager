# Delta for components (refactor-ui-editar-rutina)

## Purpose

This spec defines the UI component requirements for the Edit Routine page refactor. It establishes exact Tailwind class contracts, visual states, token mappings, and enforcement rules to ensure pixel-perfect consistency across all components.

---

## ADDED Requirements

### Requirement: EXACT Token System

The system SHALL use these EXACT color token values in CSS custom properties for the Edit Routine page.

#### Dark Mode Tokens

| Token | Value | Tailwind Mapping | Usage |
|-------|-------|-----------------|-------|
| `--color-base` | `#0f0f10` | N/A (page bg) | Page background |
| `--color-surface` | `#18181b` | `bg-[#18181b]` | Card/component backgrounds |
| `--color-border` | `#27272a` | `border-[#27272a]` | All borders |
| `--color-hover` | `#1f1f23` | `hover:bg-[#1f1f23]` | Hover backgrounds |
| `--color-muted` | `#a1a1aa` | `text-[#a1a1aa]` | Muted text |
| `--color-foreground` | `#fafafa` | `text-[#fafafa]` | Primary text |
| `--color-primary` | `#E11D48` | `bg-[#E11D48]` | Primary actions (NO secondary CTAs) |

#### Light Mode Tokens

| Token | Value | Tailwind Mapping | Usage |
|-------|-------|-----------------|-------|
| `--color-base` | `#f8fafc` | N/A (page bg) | Page background |
| `--color-surface` | `#ffffff` | `bg-white` / `dark:bg-[#ffffff]` | Card backgrounds |
| `--color-border` | `#e2e8f0` | `border-[#e2e8f0]` | All borders |
| `--color-hover` | `#f1f5f9` | `hover:bg-[#f1f5f9]` | Hover backgrounds |
| `--color-muted` | `#64748b` | `text-[#64748b]` | Muted text |
| `--color-foreground` | `#111827` | `text-[#111827]` | Primary text |
| `--color-primary` | `#48b8c9` | `bg-[#48b8c9]` | Primary actions |

#### Scenario: Dark mode renders with exact tokens

- GIVEN a user with dark mode preference views the Edit Routine page
- WHEN the page renders
- THEN all components MUST use dark mode tokens
- AND `bg-surface` MUST resolve to `#18181b`
- AND `text-muted` MUST resolve to `#a1a1aa`
- AND `border-border` MUST resolve to `#27272a`

#### Scenario: Light mode renders with exact tokens

- GIVEN a user with light mode preference views the Edit Routine page
- WHEN the page renders
- THEN all components MUST use light mode tokens
- AND `bg-surface` MUST resolve to `#ffffff`
- AND `text-muted` MUST resolve to `#64748b`
- AND `border-border` MUST resolve to `#e2e8f0`

---

### Requirement: "Días de entrenamiento" Section Container

The "Días de entrenamiento" section container SHALL use these exact classes.

#### Container Contract

```tsx
<div className="bg-surface border border-border rounded-xl p-4">
```

#### Title Contract

```tsx
<h2 className="text-lg font-semibold">
```

#### Scenario: Días section container renders

- GIVEN the Edit Routine page renders
- WHEN the "Días de entrenamiento" section displays
- THEN the container MUST have `bg-surface border border-border rounded-xl p-4`
- AND the title MUST have `text-lg font-semibold`
- AND NO additional card wrapper exists around this section

---

### Requirement: "Detalles de la Rutina" Section

The "Detalles de la Rutina" section SHALL be FLAT (no card wrapper) with specific spacing.

#### Detalles Contract

```tsx
<div className="space-y-3">
  <h3 className="text-base font-medium text-muted-foreground">
```

#### Scenario: Detalles section renders without card

- GIVEN the Edit Routine page renders
- WHEN the "Detalles de la Rutina" section displays
- THEN the section MUST have NO `bg-surface` or card styling
- AND spacing MUST be `space-y-3`
- AND title MUST be `text-base font-medium text-muted-foreground`
- AND NO border or rounded-xl on this section

---

### Requirement: DiaCard Component (RIGID CONTRACT)

The DiaCard component SHALL use this exact structure and Tailwind classes.

#### DiaCard Root

```tsx
<div className="flex flex-col h-full min-h-[140px] p-4 bg-surface border border-border rounded-xl hover:bg-hover transition-colors duration-150">
```

#### DiaCard Header

```tsx
<div className="flex items-center gap-2">
  {/* índice: badge */}
  <span className="text-xs text-muted-foreground">
  {/* título */}
  <h3 className="text-sm font-medium truncate">
```

#### DiaCard Description

```tsx
<p className="text-sm text-muted-foreground line-clamp-1 min-h-[20px]">
  {/* placeholder: same style, NO italic */}
</p>
```

#### DiaCard Body

```tsx
<div className="flex-1">
```

#### DiaCard Footer

```tsx
<div className="flex items-center justify-between pt-2">
  {/* Badge: neutral style */}
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
  {/* CTA */}
  <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
    Ir a día <ChevronRight className="inline w-4 h-4 ml-1" />
  </a>
```

#### Scenario: DiaCard renders in default state

- GIVEN a DiaCard component renders with a day that has exercises
- WHEN the card displays
- THEN the root MUST have `flex flex-col h-full min-h-[140px] p-4 bg-surface border border-border rounded-xl hover:bg-hover transition-colors duration-150`
- AND header index MUST be `text-xs text-muted-foreground`
- AND title MUST be `text-sm font-medium truncate`
- AND description MUST be `text-sm text-muted-foreground line-clamp-1 min-h-[20px]`
- AND footer MUST have neutral badge and muted CTA

#### Scenario: DiaCard renders with empty description

- GIVEN a DiaCard component renders with a day that has no muscle group description
- WHEN the card displays
- THEN the description placeholder MUST use same style as filled description
- AND NO italic styling
- AND min-h-[20px] MUST be present to prevent layout shift

#### Scenario: DiaCard hover state

- GIVEN a user hovers over a DiaCard
- WHEN the hover occurs
- THEN ONLY `bg-hover` color change MUST occur
- AND NO scale, size, or layout changes
- AND transition MUST be `transition-colors duration-150`

---

### Requirement: "Agregar Día" Button

The "Agregar Día" button SHALL use dashed border pattern with these exact classes.

#### Button Contract

```tsx
<button className="border border-dashed border-border bg-transparent hover:bg-surface min-h-[44px] flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-150">
```

#### Scenario: Agregar Día button renders

- GIVEN the Edit Routine page renders with fewer than 7 days
- WHEN the "Agregar Día" button displays
- THEN it MUST have `border border-dashed border-border`
- AND `bg-transparent`
- AND `min-h-[44px]`
- AND `flex items-center justify-center gap-2`
- AND `text-muted-foreground hover:text-foreground`

#### Scenario: Agregar Día button hover

- GIVEN a user hovers over the "Agregar Día" button
- WHEN the hover occurs
- THEN background MUST change to `bg-surface`
- AND text MUST change to `text-foreground`
- AND NO other visual changes occur

---

### Requirement: SegmentedControl Component

The SegmentedControl SHALL use fixed dimensions and primary color for active state.

#### SegmentedControl Contract

```tsx
<div className="h-9 px-3">
  {/* Active button */}
  <button className="bg-primary text-white">
  {/* Inactive button */}
  <button className="text-muted-foreground hover:text-foreground bg-transparent">
```

#### Critical Rules

- Height MUST be `h-9` (fixed, no variation)
- Horizontal padding MUST be `px-3`
- Active state MUST be `bg-primary text-white`
- Inactive state MUST be `text-muted-foreground hover:text-foreground bg-transparent`
- NO borders, NO shadows in ANY state
- NO background changes on inactive buttons

#### Scenario: SegmentedControl renders with active selection

- GIVEN a SegmentedControl renders with "fuerza" selected
- WHEN the component displays
- THEN the container MUST have `h-9 px-3`
- AND the "fuerza" button MUST have `bg-primary text-white`
- AND other buttons MUST have `text-muted-foreground hover:text-foreground bg-transparent`

#### Scenario: SegmentedControl inactive button hover

- GIVEN a user hovers over an inactive SegmentedControl button
- WHEN the hover occurs
- THEN ONLY text color change to `text-foreground` MUST occur
- AND NO background color change
- AND NO borders or shadows appear

---

### Requirement: Grid Layout

The days grid SHALL use responsive columns with exact gap and full-height items.

#### Grid Contract

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
  {/* Each item */}
  <div className="h-full">
    <DiaCard />
  </div>
</div>
```

#### Scenario: Grid renders responsive columns

- GIVEN the Edit Routine page renders with 3+ days
- WHEN the grid displays
- THEN mobile MUST show 1 column
- AND tablet (md) MUST show 2 columns
- AND desktop (xl) MUST show 3 columns
- AND gap MUST be `gap-4`
- AND each item MUST be wrapped in `h-full`

---

### Requirement: Global Interaction Rules

All interactive surfaces SHALL follow these interaction patterns.

#### Transition Contract

```tsx
<InteractiveElement className="transition-colors duration-150 ease-out">
```

#### Cursor Contract

```tsx
<clickableElement className="cursor-pointer">
<nonClickableElement className="/* NO cursor-pointer */">
```

#### Hover State Rules

- hover: ONLY `bg` or `text` changes
- hover: NEVER size, margin, padding, or layout properties

#### Active State Rules

```tsx
<button className="active:brightness-95">
```

- active: ONLY `brightness-95`
- active: NO scale, NO transform

#### Focus State Rules

```tsx
<element className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
```

#### Scenario: Button follows interaction rules

- GIVEN a Button component renders
- WHEN the user hovers
- THEN ONLY bg/text color MUST change
- AND transition MUST be `transition-colors duration-150 ease-out`
- WHEN the user clicks
- THEN ONLY `brightness-95` MUST apply
- AND NO scale or size changes
- WHEN the user focuses via keyboard
- THEN `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50` MUST apply

---

### Requirement: Radius and Border Standards

All components SHALL use `rounded-xl` and `border-border` consistently.

#### Radius Contract

```tsx
<element className="rounded-xl">
```

#### Border Contract

```tsx
<element className="border border-border">
```

#### Rule

- `rounded-xl` MUST be used on EVERYTHING (cards, buttons, containers)
- `border border-border` MUST be the ONLY border style
- NO stronger border variants (e.g., `border-2`, `border-black`)
- NO multiple borders on same element

#### Scenario: New component uses standard radius/border

- GIVEN a developer creates a new component for the Edit Routine page
- WHEN the component renders
- THEN `rounded-xl` MUST be applied
- AND `border border-border` MUST be applied
- AND NO stronger border variants exist

---

### Requirement: Canonical Spacing

Component spacing SHALL follow these canonical patterns.

#### Spacing Contract

| Context | Tailwind Classes |
|---------|-----------------|
| Card internal padding | `p-4` |
| Section padding | `p-4` |
| Between form fields | `space-y-2` |
| Between big blocks | `space-y-4` |

#### Rule

- NO `space-y` outside these contexts
- Card internal: `p-4` ONLY
- Form fields: `space-y-2` ONLY
- Page sections: `space-y-4` ONLY

#### Scenario: Form fields use canonical spacing

- GIVEN a form renders on the Edit Routine page
- WHEN the form fields display
- THEN vertical spacing between fields MUST be `space-y-2`
- AND card padding MUST be `p-4`
- AND NO arbitrary space-y values

---

### Requirement: Iconography Standards

All icons SHALL use consistent sizing and colors.

#### Icon Contract

```tsx
<Icon className="h-4 w-4" />
```

| Property | Value | Rule |
|----------|-------|------|
| Size | `h-4 w-4` | ALL icons MUST use this size |
| Default color | `text-muted-foreground` | Never use hardcoded colors |
| Hover color | Inherits `text-foreground` | On hoverable containers |

#### Scenario: Icon renders with correct size

- GIVEN an icon renders on the Edit Routine page
- WHEN the icon displays
- THEN it MUST have `h-4 w-4`
- AND default color MUST be `text-muted-foreground`
- AND NOT hardcoded hex values like `#9ca3af`

---

### Requirement: "Ir a día" CTA

The "Ir a día" link/button SHALL use muted color with arrow icon.

#### CTA Contract

```tsx
<a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
  Ir a día <ChevronRight className="inline w-4 h-4 ml-1" />
</a>
```

#### Rule

- NEVER use `text-primary` or `#E11D48` on this CTA
- CTA MUST be `text-muted-foreground hover:text-foreground`
- Arrow icon MUST have `ml-1` (margin-left gap)

#### Scenario: Ir a día CTA renders correctly

- GIVEN a DiaCard renders
- WHEN the footer CTA displays
- THEN "Ir a día" text MUST be `text-muted-foreground hover:text-foreground`
- AND arrow icon MUST be inline with `ml-1`
- AND color MUST NOT be `text-primary`

---

## MODIFIED Requirements

### Requirement: DiaCard Typography Contract

(Previously: title was `font-semibold`, description had italic placeholder)

The title SHALL be `text-sm font-medium` (previously `font-semibold`).

The description SHALL NOT use italic for empty state (previously used italic).

#### Scenario: DiaCard title typography updated

- GIVEN a DiaCard renders
- WHEN the title displays
- THEN title MUST be `text-sm font-medium` (NOT `font-semibold`)
- AND title MUST still be truncated with `truncate`

#### Scenario: DiaCard empty description no longer italic

- GIVEN a DiaCard renders with empty muscle group
- WHEN the placeholder text displays
- THEN the placeholder MUST be `text-sm text-muted-foreground`
- AND MUST NOT be italic

---

### Requirement: SegmentedControl Active State

(Previously: active state used complex multi-class pattern with shadows)

The active button SHALL use simple `bg-primary text-white`.

#### Scenario: SegmentedControl active uses simple primary

- GIVEN a SegmentedControl renders with an option selected
- WHEN the active button displays
- THEN it MUST have `bg-primary text-white`
- AND NO additional shadow or border classes
- AND NO `data-[selected=true]` attribute dependency

---

## REMOVED Requirements

### Requirement: DiaCard Scale on Hover

(Reason: Global rule says hover NEVER changes size, only bg/text)

The hover effect MUST NOT include `hover:scale-[1.01]` or any scale transform.

### Requirement: DiaCard Shadow

(Reason: `border-border` provides sufficient separation without shadow)

The card MUST NOT have `shadow-md` or any box-shadow.

### Requirement: Inconsistent Border Radius

(Reason: All components MUST use `rounded-xl` uniformly)

The inconsistent `rounded-2xl` variant MUST NOT be used anywhere.

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/components/admin/dia-card.tsx` | MODIFY - Apply rigid contract, remove scale/shadow, fix typography |
| `src/components/admin/dia-manager.tsx` | MODIFY - Apply Días section container styles, update Agregar Día button |
| `src/components/admin/rutina-form.tsx` | MODIFY - Remove card wrapper from Detalles section, apply space-y-3 |
| `src/components/admin/segmented-control.tsx` | MODIFY - Fix to h-9 px-3, active=bg-primary, no borders/shadows |
| `src/app/globals.css` | MODIFY - Ensure exact token values are defined |

---

## Token Mapping Table

### Tailwind Class → CSS Variable Mapping

| Tailwind Class Pattern | Dark Mode Value | Light Mode Value |
|------------------------|-----------------|------------------|
| `bg-surface` | `#18181b` | `#ffffff` |
| `border-border` | `#27272a` | `#e2e8f0` |
| `hover:bg-hover` | `#1f1f23` | `#f1f5f9` |
| `text-muted-foreground` | `#a1a1aa` | `#64748b` |
| `text-foreground` | `#fafafa` | `#111827` |
| `bg-primary` | `#E11D48` | `#48b8c9` |
| `bg-muted` | `#18181b` (or appropriate) | `#f8fafc` (or appropriate) |

---

## Accessibility Requirements

### Contrast Ratios (WCAG AA Minimum)

| Element | Dark Mode | Light Mode | Pass |
|---------|-----------|------------|------|
| text-foreground on bg-surface | `#fafafa` on `#18181b` | `#111827` on `#ffffff` | ✅ |
| text-muted-foreground on bg-surface | `#a1a1aa` on `#18181b` | `#64748b` on `#ffffff` | ✅ |
| text-white on bg-primary | `#ffffff` on `#E11D48` | `#ffffff` on `#48b8c9` | ✅ |

### Focus Indicators

- ALL interactive elements MUST have `focus-visible:outline-none`
- ALL interactive elements MUST have `focus-visible:ring-2 focus-visible:ring-primary/50`
- Focus ring MUST be visible against all backgrounds

### Keyboard Navigation

- SegmentedControl buttons MUST be keyboard navigable with Arrow keys
- Tab navigation MUST follow logical order
- Enter/Space MUST activate focused button

---

## Enforcement Rules

### Global Rule 1: No Layout Changes on State

```typescript
// BAD
className="hover:scale-105 active:scale-95"

// GOOD  
className="hover:bg-hover active:brightness-95"
```

State changes (hover, active, focus) MUST ONLY change color, NEVER layout properties (width, height, margin, padding, scale).

### Global Rule 2: Single Source of Truth for Padding

```typescript
// Every card MUST have p-4 and NOTHING else
className="p-4 bg-surface border border-border rounded-xl"

// NOT
className="p-3 bg-surface ..." // p-3 is VIOLATION
className="p-6 bg-surface ..." // p-6 is VIOLATION
```

Components MUST NOT define padding outside the contract. If a component needs different padding, it is a BUG.

### Global Rule 3: No Color Deviations

```typescript
// BAD - hardcoded colors
className="text-[#9ca3af] bg-[#121212]"

// GOOD - semantic tokens
className="text-muted-foreground bg-surface"
```

Developers MUST NOT introduce new hardcoded colors. All colors MUST use the defined token system.

### Global Rule 4: Primary Color Scope

```typescript
// Primary color ONLY for:
// - Main submit button (Crear/Actualizar Rutina)
// - SegmentedControl active state

// Primary color FORBIDDEN for:
// - "Ir a día" CTA
// - "Agregar Día" button  
// - Cancel buttons
// - Secondary actions
```

`bg-primary` / `#E11D48` / `#48b8c9` MUST ONLY be used for the PRIMARY action. All secondary actions use muted colors.

---

## Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| ERC1 | Dark mode tokens match exact values | Inspect globals.css |
| ERC2 | Light mode tokens match exact values | Inspect globals.css |
| ERC3 | Días section uses `bg-surface border border-border rounded-xl p-4` | Visual inspection |
| ERC4 | Detalles section has NO card, uses `space-y-3` | Visual inspection |
| ERC5 | DiaCard follows rigid contract | Visual inspection |
| ERC6 | Agregar Día uses dashed border, min-h-[44px] | Visual inspection |
| ERC7 | SegmentedControl: h-9 px-3, active=bg-primary | Visual inspection |
| ERC8 | Grid: 1/2/3 cols responsive, gap-4, h-full items | Visual inspection |
| ERC9 | All transitions: `transition-colors duration-150` | Visual inspection |
| ERC10 | Hover: ONLY bg/text, NO size changes | Visual inspection |
| ERC11 | Active: ONLY brightness-95, NO scale | Visual inspection |
| ERC12 | All rounded-xl, border-border (no stronger) | Visual inspection |
| ERC13 | Icons: h-4 w-4, text-muted-foreground | Visual inspection |
| ERC14 | "Ir a día": muted color, NOT primary | Visual inspection |
| ERC15 | Contrast ratios pass WCAG AA | Contrast checker |
| ERC16 | Focus visible on all interactive elements | Keyboard navigation test |

---

## Scenarios Summary

| Scenario | Given | When | Then |
|----------|-------|------|------|
| Dark mode tokens | Dark mode preference | Page renders | Exact dark tokens applied |
| Light mode tokens | Light mode preference | Page renders | Exact light tokens applied |
| Días section container | Page renders | Section displays | Correct container styles |
| Detalles section flat | Page renders | Section displays | No card, space-y-3 |
| DiaCard default | Day with exercises | Card displays | Correct structure/styles |
| DiaCard empty desc | Day without muscles | Card displays | No italic, min-h-[20px] |
| DiaCard hover | User hovers | Hover occurs | ONLY bg-hover change |
| Agregar Día button | Page renders | Button displays | Dashed border, min-h-44 |
| Agregar Día hover | User hovers | Hover occurs | bg-surface, text-foreground |
| SegmentedControl active | Option selected | Component displays | bg-primary text-white |
| SegmentedControl inactive hover | User hovers inactive | Hover occurs | ONLY text-foreground |
| Grid responsive | Page renders | Grid displays | 1/2/3 cols at breakpoints |
| Button interaction | User interacts | Various states | Only color changes |
| Icon sizing | Icon renders | Icon displays | h-4 w-4 |
| Ir a día CTA | DiaCard renders | Footer displays | Muted color, NOT primary |
