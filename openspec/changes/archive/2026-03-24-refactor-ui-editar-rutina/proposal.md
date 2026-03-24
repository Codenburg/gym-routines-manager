# Proposal: refactor-ui-editar-rutina

## Intent

The "Editar Rutina" page suffers from visual hierarchy problems: two equally-weighted sections compete for attention, the "Agregar Día" button lacks affordance, and inconsistent color tokens create visual noise. This refactor establishes clear hierarchy where "Días de entrenamiento" dominates, "Detalles de la Rutina" recedes, and interactive elements have unambiguous states using the exact dark/light mode token system.

## Scope

### In Scope
- Implement EXACT dark mode tokens: `--color-base: #0f0f10`, `--color-surface: #18181b`, `--color-border: #27272a`, `--color-hover: #1f1f23`, `--color-muted: #a1a1aa`, `--color-foreground: #fafafa`, `--color-primary: #E11D48`
- Implement EXACT light mode tokens: `--color-base: #f8fafc`, `--color-surface: #ffffff`, `--color-border: #e2e8f0`, `--color-hover: #f1f5f9`, `--color-muted: #64748b`, `--color-foreground: #111827`, `--color-primary: #48b8c9`
- Restructure section hierarchy on `admin/rutinas/[id]/page.tsx`
- Implement rigid DiaCard contract with EXACT styling
- Redesign "Agregar Día" button with dashed border pattern
- Fix SegmentedControl: active=filled with primary, inactive=muted
- Grid layout: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`
- Apply global interaction, typography, spacing, iconography, and accessibility standards

### Out of Scope
- Changes to backend API or data model
- Changes to DiaManager internal logic (only visual/structural changes)
- New features or functionality

## Approach

### Color Token System (EXACT VALUES)

**Dark Mode Tokens:**
```css
--color-base: #0f0f10
--color-surface: #18181b
--color-border: #27272a
--color-hover: #1f1f23
--color-muted: #a1a1aa
--color-foreground: #fafafa
--color-primary: #E11D48 (mantener, NO usar en CTAs secundarios)
```

**Light Mode Tokens:**
```css
--color-base: #f8fafc
--color-surface: #ffffff
--color-border: #e2e8f0
--color-hover: #f1f5f9
--color-muted: #64748b
--color-foreground: #111827
--color-primary: #48b8c9 (turquesa light)
```

### Section Hierarchy (RIGID CONTRACTS)

**1. "Días de entrenamiento" Section:**
```
Container: bg-surface, border border-border, rounded-xl, p-4
Title: text-lg font-semibold
```

**2. "Detalles de la Rutina" Section:**
```
NO card (no bg-surface)
space-y-3
Title: text-base font-medium text-muted-foreground
```

### DiaCard (RIGID CONTRACT)

**Typography & Truncation:**
```
Title: text-sm font-medium truncate
Description: text-sm text-muted-foreground line-clamp-1
Text container: min-h-[20px] (stable height, NO micro-jumps)
```

**Structure:**
```
Root: flex flex-col h-full min-h-[140px] p-4 bg-surface border border-border rounded-xl
Header: flex items-center gap-2
  - índice: badge text-xs text-muted-foreground
  - título: text-sm font-medium truncate
Description:
  - text-sm text-muted-foreground line-clamp-1
  - placeholder same style, NO italic
Body: flex-1
Footer: flex items-center justify-between pt-2
  - badge ejercicios: neutral style
  - CTA "Ir a día": text-sm text-muted-foreground hover:text-foreground
```

### "Ir a día" CTA (Affordance Without Noise)
```
Arrow icon with ml-1
group-hover:translate-x-0.5 (optional subtle movement)
NEVER use primary color
```

### "Agregar Día" Button (Action Clarity)
```
min-h-[44px]
flex items-center justify-center gap-2
border border-dashed border-border
bg-transparent
hover:bg-surface
text-muted-foreground hover:text-foreground
Icon and text share hover state
```

### SegmentedControl (Visual Alignment)
```
Fixed height: h-9
Consistent horizontal padding: px-3
Active: bg-primary text-white
Inactive: text-muted-foreground hover:text-foreground bg-transparent
NO shadows or borders in ANY state
```

### Grid (Stability)
```
grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4
Each card wrapped in h-full container
NO reflow:
  - DON'T animate layout properties (height, margin, padding)
```

### Interaction (Global Consistency)
```
All interactive surfaces: transition-colors duration-150 ease-out
cursor-pointer only where clickable
States:
  - hover: ONLY changes bg or text, NEVER size or layout
  - active: slight darkening (brightness-95), NO scale
```

### Borders & Radius
```
Unique radius: rounded-xl on EVERYTHING (cards, large buttons, containers)
Borders:
  - default: border border-border
  - NEVER use stronger variants or multiple borders
```

### Canonical Spacing
```
Internal:
  - cards: p-4
  - sections: p-4
Vertical:
  - inside components: space-y-2
  - between big blocks: space-y-4
DELETE any space-y outside these two levels
```

### Iconography
```
Unique size: h-4 w-4
Color:
  - default: text-muted-foreground
  - hover: inherits text-foreground
```

### Accessibility Minimum
```
Contrast:
  - text on surface ≥ AA with #fafafa and #a1a1aa
Focus:
  - focus-visible:outline-none
  - focus-visible:ring-2 focus-visible:ring-primary/50
```

### GLOBAL RULE
- NO state alters layout, only color/content
- NO component defines different padding outside this contract
- If a component needs exception → considered BUG
- DON'T introduce new tokens, reuse the defined ones

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(admin)/admin/rutinas/[id]/page.tsx` | Modified | Section hierarchy, exact token application |
| `src/components/admin/dia-card.tsx` | Modified | Rigid contract implementation with typography/spacing standards |
| `src/components/admin/dia-manager.tsx` | Modified | Días section with bg-surface, border-border, rounded-xl, p-4 |
| `src/components/admin/rutina-form.tsx` | Modified | Detalles section flat (no card), space-y-3 |
| `src/components/admin/segmented-control.tsx` | Modified | h-9, px-3, active=bg-primary text-white, inactive=text-muted-foreground |
| `src/components/admin/agregar-dia-button.tsx` | Modified | min-h-[44px], border-dashed border-border, gap-2 |
| `src/styles/globals.css` | Modified | CSS variables for exact token values |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Primary color #E11D48 used incorrectly on secondary CTAs | High | Strict enforcement: primary ONLY for main action, secondary CTAs use muted |
| Inconsistent hover state across components | Medium | All hover uses `hover:bg-hover` pattern with transition-colors duration-150 |
| Detalles section loses visual hierarchy if card added | High | Explicit NO card rule in contract |
| Layout reflow during state changes | Medium | Stable heights, no layout property animations |
| Accessibility contrast failures | Medium | Verify #fafafa on #18181b and #a1a1aa combinations |

## Rollback Plan

1. Revert CSS variable definitions in `globals.css` to previous values
2. Restore section structure in `page.tsx`
3. Restore DiaCard to previous implementation
4. Revert SegmentedControl to previous state classes
5. Revert "Agregar Día" button styling

## Dependencies

- No external dependencies

## Success Criteria

- [ ] Dark mode tokens: base `#0f0f10`, surface `#18181b`, border `#27272a`, hover `#1f1f23`, muted `#a1a1aa`, foreground `#fafafa`, primary `#E11D48`
- [ ] Light mode tokens: base `#f8fafc`, surface `#ffffff`, border `#e2e8f0`, hover `#f1f5f9`, muted `#64748b`, foreground `#111827`, primary `#48b8c9`
- [ ] Días section: bg-surface, border-border, rounded-xl, p-4, title text-lg font-semibold
- [ ] Detalles section: NO card, space-y-3, title text-base font-medium text-muted-foreground
- [ ] DiaCard title: text-sm font-medium truncate with min-h-[20px] text container
- [ ] DiaCard description: text-sm text-muted-foreground line-clamp-1
- [ ] DiaCard: flex h-full min-h-[140px], header with badge+title, footer with ejercicios badge+CTA, hover:bg-hover
- [ ] "Ir a día" CTA: arrow icon with ml-1, NEVER primary color
- [ ] "Agregar Día": min-h-[44px], flex items-center justify-center gap-2, border-dashed border-border
- [ ] SegmentedControl: h-9, px-3, active=bg-primary text-white, inactive=text-muted-foreground, NO shadows/borders
- [ ] Grid: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4, each item h-full
- [ ] All interactive surfaces: transition-colors duration-150 ease-out, cursor-pointer only where clickable
- [ ] Hover: ONLY bg/text changes, NEVER size/layout; active: brightness-95, NO scale
- [ ] All rounded-xl, border border-border (no stronger variants)
- [ ] Canonical spacing: cards p-4, sections p-4, components space-y-2, blocks space-y-4
- [ ] Icons: h-4 w-4, default text-muted-foreground
- [ ] Accessibility: contrast ≥ AA, focus-visible:outline-none with focus-visible:ring-2 focus-visible:ring-primary/50
- [ ] GLOBAL: NO state alters layout, NO component defines different padding outside contract
