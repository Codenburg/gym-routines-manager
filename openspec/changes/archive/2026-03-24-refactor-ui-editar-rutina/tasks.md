# Tasks: refactor-ui-editar-rutina

## Overview

UI-only refactor of the Edit Routine page implementing exact dark/light mode tokens and rigid component contracts. No backend changes.

## Phase 1: CSS Token Infrastructure

- [ ] 1.1 Read current `src/app/globals.css` to locate existing token definitions
- [ ] 1.2 Add/update 7 core tokens in `:root` (light mode): `--color-base: #f8fafc`, `--color-surface: #ffffff`, `--color-border: #e2e8f0`, `--color-hover: #f1f5f9`, `--color-muted: #64748b`, `--color-foreground: #111827`, `--color-primary: #48b8c9`
- [ ] 1.3 Add/update 7 core tokens in `.dark` (dark mode): `--color-base: #0f0f10`, `--color-surface: #18181b`, `--color-border: #27272a`, `--color-hover: #1f1f23`, `--color-muted: #a1a1aa`, `--color-foreground: #fafafa`, `--color-primary: #E11D48`
- [ ] 1.4 Verify existing shadcn CSS variables don't conflict with new tokens

## Phase 2: DiaCard Rewrite (Rigid Contract)

- [ ] 2.1 Read current `src/components/admin/dia-card.tsx`
- [ ] 2.2 Rewrite root element: `div.flex.flex-col.h-full.min-h-[140px].p-4.bg-surface.border.border-border.rounded-xl.hover:bg-hover.transition-colors.duration-150`
- [ ] 2.3 Implement header: `header.flex.items-center.gap-2` with index badge (`span.text-xs.text-muted-foreground`) and title (`h3.text-sm.font-medium.truncate`)
- [ ] 2.4 Implement description paragraph: `p.text-sm.text-muted-foreground.line-clamp-1.min-h-[20px]` with musculosEnfocados or placeholder
- [ ] 2.5 Implement body div: `div.flex-1`
- [ ] 2.6 Implement footer: `footer.flex.items-center.justify-between.pt-2` with ejercicios count badge and `Ir a día →` link
- [ ] 2.7 Verify: NO scale transforms, NO size changes on any state
- [ ] 2.8 Verify: cursor-pointer on clickable elements only

## Phase 3: DiaManager Updates

- [ ] 3.1 Read current `src/components/admin/dia-manager.tsx`
- [ ] 3.2 Update section container: `section.bg-surface.border.border-border.rounded-xl.p-4`
- [ ] 3.3 Update title: `h2.text-lg.font-semibold`
- [ ] 3.4 Update "Agregar Día" button: `border.border-dashed.border-border.bg-transparent.hover:bg-surface.min-h-[44px].flex.items-center.justify-center.gap-2.text-muted-foreground.hover:text-foreground.transition-all.duration-150`
- [ ] 3.5 Verify grid: `grid.grid-cols-1.md:grid-cols-2.xl:grid-cols-3.gap-4` with `h-full` on each item
- [ ] 3.6 If inline button exists, apply exact button contract above

## Phase 4: RutinaForm Modifications

- [ ] 4.1 Read current `src/components/admin/rutina-form.tsx`
- [ ] 4.2 Remove AdminCard wrapper from Detalles section (NO card rule)
- [ ] 4.3 Apply flat container: `space-y-3` directly
- [ ] 4.4 Update title: `h2.text-base.font-medium.text-muted-foreground`
- [ ] 4.5 Verify: NO border, NO bg-surface, NO rounded-xl on Detalles container

## Phase 5: SegmentedControl Updates

- [ ] 5.1 Read current `src/components/admin/segmented-control.tsx`
- [ ] 5.2 Apply fixed height: `h-9` and horizontal padding: `px-3`
- [ ] 5.3 Update active state: `bg-primary.text-white` (NO borders, NO shadows)
- [ ] 5.4 Update inactive state: `text-muted-foreground.hover:text-foreground.bg-transparent`
- [ ] 5.5 Verify icon size: `h-4.w-4`
- [ ] 5.6 Verify: NO layout changes on state (no scale, no height transitions)

## Phase 6: Page Level Updates

- [ ] 6.1 Read current `src/app/(admin)/admin/rutinas/[id]/page.tsx`
- [ ] 6.2 Update Detalles section: remove AdminCard, apply flat `space-y-3` container
- [ ] 6.3 Verify Días section has: `bg-surface.border.border-border.rounded-xl.p-4`
- [ ] 6.4 Verify section hierarchy: Días section visually dominates, Detalles recedes
- [ ] 6.5 Apply `focus-visible:outline-none.focus-visible:ring-2.focus-visible:ring-primary/50` globally if not present

## Phase 7: Verification

- [ ] 7.1 Run dev server and verify dark mode tokens visually at 320px, 768px, 1024px, 1440px
- [ ] 7.2 Run dev server and verify light mode tokens visually at same breakpoints
- [ ] 7.3 Verify hover states: ONLY color changes, NO reflow
- [ ] 7.4 Verify active states: `brightness-95` only, NO scale
- [ ] 7.5 Verify grid: 1→2→3 columns at proper breakpoints
- [ ] 7.6 Verify "Agregar Día" button: dashed border visible, bg-transparent
- [ ] 7.7 Verify SegmentedControl: active pill filled with primary color

## Files Summary

| File | Tasks |
|------|-------|
| `src/app/globals.css` | 1.1–1.4 |
| `src/components/admin/dia-card.tsx` | 2.1–2.8 |
| `src/components/admin/dia-manager.tsx` | 3.1–3.6 |
| `src/components/admin/rutina-form.tsx` | 4.1–4.5 |
| `src/components/admin/segmented-control.tsx` | 5.1–5.6 |
| `src/app/(admin)/admin/rutinas/[id]/page.tsx` | 6.1–6.5 |
| Verification | 7.1–7.7 |

## Global Rules to Follow

- `rounded-xl` everywhere
- `transition-colors.duration-150.ease-out`
- `cursor-pointer` only where clickable
- hover: ONLY bg or text, NEVER size
- active: `brightness-95` NO scale
- `focus-visible:outline-none.focus-visible:ring-2.focus-visible:ring-primary/50`
