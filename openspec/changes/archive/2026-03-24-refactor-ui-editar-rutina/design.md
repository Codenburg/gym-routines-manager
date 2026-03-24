# Design: refactor-ui-editar-rutina

## Technical Approach

This is a UI-only refactor of the Edit Routine page (`admin/rutinas/[id]/page.tsx`) implementing a rigid token system with exact color values. The refactor establishes clear visual hierarchy: the "Días de entrenamiento" section dominates with full card styling, while "Detalles de la Rutina" recedes with minimal visual weight. All colors are defined as CSS custom properties in `globals.css` using the EXACT hex values specified in the proposal—no approximations, no oklch conversions.

## Architecture Decisions

### Decision: Exact Hex Token Values Over oklch

**Choice**: Use exact hex values for the 7 core tokens (`--color-base`, `--color-surface`, `--color-border`, `--color-hover`, `--color-muted`, `--color-foreground`, `--color-primary`)

**Alternatives considered**: 
- Converting to oklch for perceptual uniformity
- Using existing shadcn CSS variables with modifications

**Rationale**: The proposal explicitly specifies exact hex values for a reason—design一致性 across the codebase. oklch conversions would introduce rounding differences that break the "EXACT" requirement. The existing `globals.css` already has some of these tokens defined but with different values (e.g., `--color-base: #0a0a0a` in dark vs required `#0f0f10`).

### Decision: CSS Custom Properties for Theme Tokens

**Choice**: Define all 7 tokens as CSS custom properties in `:root` (light) and `.dark` (dark)

**Alternatives considered**:
- Tailwind `@layer base` with `@apply`
- CSS variables on specific components only

**Rationale**: Global CSS custom properties allow all components to reference tokens without prop drilling. Tailwind's `@apply` in `base` layer works but creates specificity conflicts with shadcn. Component-scoped variables break when components are nested in different contexts.

### Decision: DiaCard Self-Contained Structure

**Choice**: DiaCard receives only `dia` data, `rutinaId`, and `index`—no callbacks, no external state

**Alternatives considered**:
- DiaCard accepts an `onEdit` callback prop
- DiaCard manages its own hover state with useState

**Rationale**: The proposal specifies "DiaCard is self-contained, receives only data + index." Adding callbacks or internal state would violate the rigid contract. Navigation happens via static `<a>` tag to `/admin/rutinas/${rutinaId}/dias/${dia.id}`.

### Decision: No Layout Changes Between States

**Choice**: State changes (hover, active) affect ONLY color/content, never layout properties

**Alternatives considered**:
- Scale transform on hover (current implementation has `hover:scale-[1.01]`)
- Height transitions for expand/collapse

**Rationale**: Layout property animations cause reflow and are explicitly prohibited in the proposal's GLOBAL RULE: "NO state alters layout, only color/content."

## Data Flow

```
EditRutinaPage (Server Component)
    │
    ├── PageHeader (static, no data)
    │
    ├── Detalles Section (RutinaForm inside, NO card wrapper)
    │       │
    │       └── SegmentedControl (local state, form submission only)
    │
    └── Días Section (DiaManager with local state for optimistic updates)
            │
            ├── Add Day Form (conditional, shown when isAdding=true)
            │
            └── Days Grid (CSS Grid, 1→2→3 columns responsive)
                    │
                    └── DiaCard × N (self-contained, stateless)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modify | Add/update 7 core CSS tokens in `:root` and `.dark` |
| `src/components/admin/dia-card.tsx` | Rewrite | Rigid contract: flex h-full min-h-[140px], exact typography scale, hover:bg-hover only |
| `src/components/admin/dia-manager.tsx` | Modify | Container: bg-surface border-border rounded-xl p-4, "Agregar Día" button with dashed border |
| `src/components/admin/rutina-form.tsx` | Modify | Remove card wrapper, use space-y-3 directly, reduce title weight |
| `src/components/admin/segmented-control.tsx` | Modify | h-9 fixed height, px-3 padding, active=bg-primary text-white, inactive=text-muted-foreground |
| `src/app/(admin)/admin/rutinas/[id]/page.tsx` | Modify | Remove AdminCard from Detalles section, adjust spacing hierarchy |

## Interfaces / Contracts

### CSS Token Contract (EXACT VALUES - MUST NOT DEVIATE)

```css
/* Light Mode (:root) */
--color-base: #f8fafc;
--color-surface: #ffffff;
--color-border: #e2e8f0;
--color-hover: #f1f5f9;
--color-muted: #64748b;
--color-foreground: #111827;
--color-primary: #48b8c9;

/* Dark Mode (.dark) */
--color-base: #0f0f10;
--color-surface: #18181b;
--color-border: #27272a;
--color-hover: #1f1f23;
--color-muted: #a1a1aa;
--color-foreground: #fafafa;
--color-primary: #E11D48;
```

### DiaCard Contract

```tsx
interface DiaCardProps {
  dia: Dia;        // { id, nombre, musculosEnfocados?, orden, ejercicios[] }
  rutinaId: string;
  index: number;   // 0-based, displayed as #{index + 1}
  className?: string;
}

// Structure (HTML):
// div.flex.h-full.min-h-[140px].bg-surface.border.border-border.rounded-xl.p-4
//   ├─ header.flex.items-center.gap-2
//   │    ├─ span.text-xs.text-muted-foreground (##{index + 1})
//   │    └─ h3.text-sm.font-medium.truncate (dia.nombre)
//   ├─ p.text-sm.text-muted-foreground.line-clamp-1 (musculosEnfocados or placeholder)
//   ├─ div.flex-1
//   └─ footer.flex.items-center.justify-between.pt-2
//        ├─ span (ejercicios count badge)
//        └─ a (Ir a día → /admin/rutinas/${rutinaId}/dias/${dia.id})
```

### SegmentedControl Contract

```tsx
// Fixed height: h-9
// Horizontal padding: px-3
// Active state: bg-primary text-white
// Inactive state: text-muted-foreground hover:text-foreground
// NO shadows, NO borders in any state
// Icon size: h-4 w-4
```

### "Agregar Día" Button Contract

```tsx
// min-h-[44px]
// flex items-center justify-center gap-2
// border border-dashed border-border
// bg-transparent
// hover:bg-surface
// text-muted-foreground hover:text-foreground
// transition-colors duration-150 ease-out
```

### Grid Contract

```tsx
// grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4
// Each card wrapped in h-full container
// No reflow on state changes
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual Regression | All breakpoints: 320/768/1024/1440px | Playwright screenshot comparison |
| Layout Stability | No reflow on hover/active states | Playwright measure elements before/after |
| Color Tokens | CSS variables resolve correctly | CSS computed style checks |
| Accessibility | Color contrast ≥ AA | axe-core audit |
| Interaction | Hover/active states only change color | Playwright CSS property assertions |

### Breakpoint Testing Matrix

| Breakpoint | Grid Cols | Components Affected |
|------------|-----------|---------------------|
| 320px | 1 | DiaCard (full width), SegmentedControl (wraps) |
| 768px | 2 | DiaCard grid, RutinaForm (2-col) |
| 1024px | 3 | DiaCard grid |
| 1440px | 3 | All components |

## Migration / Rollout

No data migration required. This is purely visual/CSS refactor with no backend changes. Feature can be rolled out immediately after implementation.

## Open Questions

- [ ] The proposal lists `agregar-dia-button.tsx` as a file to modify, but current codebase has the button inline in `dia-manager.tsx`. Confirm: should we extract to separate component?
- [ ] The current `AdminCard` wrapper on Detalles section—should it be removed entirely or replaced with a different container? Proposal says "NO card" but some container might still be needed for visual separation from Días section.

## Implementation Order

1. **CSS Tokens** → Define exact color variables in `globals.css`
2. **DiaCard** → Rewrite with rigid contract (full component replacement)
3. **DiaManager** → Update container styling, update "Agregar Día" button
4. **RutinaForm** → Remove card wrapper, update title hierarchy
5. **SegmentedControl** → Update height/padding/states
6. **Page** → Update section hierarchy, remove AdminCard from Detalles
7. **Verify** → Check all components follow contracts at all breakpoints
