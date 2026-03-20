# Design: Admin Theme CSS Variables

## Technical Approach

Refactor 11 admin files to replace hardcoded Tailwind color utilities with CSS variable references, enabling correct light mode rendering. Add three new CSS variables (`--success`, `--success-foreground`, `--icon-badge-bg`) to `globals.css` and systematically replace old color classes following the shadcn/ui variable pattern already established in `admin-layout.tsx`.

This is a **purely visual refactor** — no logic changes, no structural changes, only className string replacements.

## Architecture Decisions

### Decision: CSS Variable Placement Strategy

**Choice**: Add new variables to existing `:root`, `.light`, and `.dark` blocks in `globals.css` alongside existing component variables (`--card-bg`, `--button-secondary-bg`, etc.)

**Alternatives considered**: Create separate theme blocks or new CSS custom property sections
**Rationale**: Follows existing convention in globals.css where component-specific variables are co-located. Admin already uses `--card-bg`, `--button-secondary-bg`, etc., so adding `--success` alongside them maintains consistency and discoverability.

### Decision: Success/Save Button Color

**Choice**: For the green save button in `GymPriceEditor.tsx`, use `bg-[var(--button-primary-bg)] hover:opacity-90 text-[var(--button-primary-foreground)]` (matching primary button) rather than `--success` (which maps to destructive-style green for error states)

**Alternatives considered**: Use `--success` variable for the save button
**Rationale**: "Save" is a primary positive action, not a destructive one. Using `button-primary-bg` maintains semantic correctness. The `--success` variable is reserved for success message backgrounds (green-tinted backgrounds, not green buttons).

### Decision: Icon Badge Background Variable

**Choice**: Add `--icon-badge-bg` to globals.css but do NOT apply it in this refactor — stat cards in `admin/page.tsx` use contextual colors (red/blue/green) that serve a purpose beyond simple badge backgrounds

**Alternatives considered**: Replace all stat card icon backgrounds with `--icon-badge-bg`
**Rationale**: The stat card icon backgrounds (`bg-red-600/20`, `bg-blue-600/20`, `bg-green-600/20`) are intentional semantic colors indicating stat type. Replacing them with a generic badge background would lose meaning. `--icon-badge-bg` is added for future use cases where a neutral badge background is needed.

## Data Flow

No data flow changes — this is purely a styling refactor.

```
globals.css (variables) ──→ Tailwind CSS (build) ──→ Browser (render)
                                      ▲
                                      │
                    Admin components (className references)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modify | Add `--success`, `--success-foreground`, `--icon-badge-bg` in `:root`, `.light`, `.dark`, and `@theme inline` |
| `src/components/admin/rutina-form.tsx` | Modify | Replace hardcoded colors per mapping |
| `src/components/admin/ejercicio-form.tsx` | Modify | Replace hardcoded colors per mapping |
| `src/components/admin/dia-manager.tsx` | Modify | Replace hardcoded colors per mapping |
| `src/components/admin/ejercicio-list.tsx` | Modify | Replace hardcoded colors per mapping |
| `src/components/admin/ejercicio-row.tsx` | Modify | Replace hardcoded colors per mapping |
| `src/components/admin/dia-section.tsx` | Modify | Replace hardcoded colors per mapping |
| `src/components/admin/delete-rutina-button.tsx` | Modify | Replace hardcoded colors per mapping |
| `src/components/admin/delete-rutina-page-button.tsx` | Modify | Replace hardcoded colors per mapping |
| `src/components/admin/GymPriceEditor.tsx` | Modify | Replace green save button with primary button variables |
| `src/app/(admin)/admin/page.tsx` | Modify | Replace `text-white/60` → `text-[var(--muted-foreground)]` in breadcrumb; fix Chinese error text to Spanish |
| `src/app/(admin)/admin/rutinas/[id]/dias/[diaId]/page.tsx` | Modify | Replace hardcoded colors per mapping |

## Complete Color Mapping Reference

| Old Class | New Class | Files |
|-----------|-----------|-------|
| `text-white` (labels, headings) | `text-[var(--foreground)]` | rutina-form, ejercicio-form, dia-manager, ejercicio-list, delete-rutina-button, delete-rutina-page-button, dias/[diaId]/page |
| `text-white/60` | `text-[var(--muted-foreground)]` | dia-manager, ejercicio-list, admin/page, dias/[diaId]/page |
| `text-white/50` | `text-[var(--muted-foreground)]` | dia-manager, ejercicio-list |
| `text-white/40` | `text-[var(--muted-foreground)]` | dia-manager, ejercicio-list |
| `text-white/30` | `text-[var(--muted-foreground)]` | dias/[diaId]/page (breadcrumb separators) |
| `bg-zinc-900` / `bg-black` | `bg-[var(--card-bg)]` | rutina-form (select), dias/[diaId]/page |
| `border-white/30` | `border-[var(--card-border)]` | rutina-form (select) |
| `bg-white/5` | `hover:bg-[var(--button-secondary-bg)]` | dia-manager (link background) |
| `bg-white/10` (hover) | `hover:bg-[var(--button-secondary-bg)]` | dia-manager, dias/[diaId]/page |
| `bg-red-600 hover:bg-red-700 text-white` | `bg-[var(--destructive)] hover:opacity-90 text-[var(--destructive-foreground)]` | delete-rutina-page-button |
| `hover:bg-red-900/30 text-red-400` (icon buttons) | `hover:bg-[var(--destructive)]/10 text-[var(--destructive)]` | delete-rutina-button, dia-manager, ejercicio-list, ejercicio-row, dia-section |
| `bg-red-900/30 text-red-400` (error messages) | `bg-[var(--destructive)]/10 border-[var(--destructive)]/30 text-[var(--destructive)]` | rutina-form, ejercicio-form, dia-manager |
| `bg-green-900/30 text-green-400` (success messages) | `bg-[var(--success)] text-[var(--success-foreground)]` | rutina-form |
| `bg-green-600 hover:bg-green-700 text-white` (save) | `bg-[var(--button-primary-bg)] hover:opacity-90 text-[var(--button-primary-foreground)]` | GymPriceEditor |

## CSS Variable Additions to globals.css

### In `:root` (line ~7 after existing variables):
```css
--success: #dcfce7;
--success-foreground: #14532d;
--icon-badge-bg: #f4f4f5;
```

### In `.light` (line ~77):
```css
--success: #dcfce7;
--success-foreground: #14532d;
--icon-badge-bg: #f4f4f5;
```

### In `.dark` (line ~198):
```css
--success: #166534;
--success-foreground: #fafafa;
--icon-badge-bg: #27272a;
```

### In `@theme inline` (add after line ~147):
```css
--color-success: var(--success);
--color-success-foreground: var(--success-foreground);
--color-icon-badge-bg: var(--icon-badge-bg);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual | Light mode rendering of all 11 refactored files | Manual: toggle theme, navigate all admin routes |
| Visual | Dark mode rendering of all 11 refactored files | Manual: verify dark mode still looks correct |
| Grep | No hardcoded bg-zinc-900, bg-black, text-white in refactored files | `grep -E "bg-zinc-900|bg-black|text-white" src/components/admin/` |
| Grep | CSS variables are defined | Inspect globals.css for `--success`, `--success-foreground`, `--icon-badge-bg` |
| Build | No TypeScript or ESLint errors | Run `npm run build` or `npm run lint` |

## Migration / Rollback

No migration required — purely additive CSS variables and className replacements.

**Rollback**: `git checkout -- src/components/admin/ src/app/(admin)/admin/ src/app/globals.css`

## Open Questions

- [ ] **Spanish translation**: The error message in `admin/page.tsx` line 151 contains Chinese text `部分数据无法完全加载。显示的是缓存值。` — should this be translated to Spanish "部分..." → "Algunos datos no pudieron cargarse completamente. Se muestran valores en caché."?
- [ ] **Icon badge usage**: `--icon-badge-bg` is being added but not applied anywhere in this refactor. Confirm this is acceptable (added for future use cases).

## Verification Checklist

After refactoring, verify:

- [ ] `globals.css` contains `--success`, `--success-foreground`, `--icon-badge-bg` in all three theme blocks
- [ ] `@theme inline` contains mappings for all three new variables
- [ ] No `bg-zinc-900` or `bg-black` in admin components
- [ ] No `text-white` used for labels/headings in admin components
- [ ] All error messages use `var(--destructive)` colors
- [ ] All success messages use `var(--success)` colors
- [ ] All destructive buttons use `var(--destructive)` variables
- [ ] Admin panel renders correctly in light mode
- [ ] Admin panel renders correctly in dark mode
- [ ] All UI text is in Spanish (including fixing Chinese text if confirmed)
