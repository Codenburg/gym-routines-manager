# Proposal: Admin Theme CSS Variables

## Intent

Refactor the entire admin panel to use CSS variables instead of hardcoded Tailwind color classes (e.g., `bg-zinc-900`, `text-zinc-50`). This will:
1. Enable correct light mode rendering in the admin panel
2. Establish a consistent theming pattern across all admin components
3. Make future theme adjustments easier and less error-prone

Currently, admin components use hardcoded dark theme colors which break in light mode. The solution is to leverage existing CSS variables and add missing ones.

## Scope

### In Scope

- Add missing CSS variables to `globals.css`:
  - `--success` and `--success-foreground` for success states
  - `--icon-badge-bg` for icon badges
- Refactor 11 files to use CSS variables:
  - `src/components/admin/rutina-form.tsx`
  - `src/components/admin/ejercicio-form.tsx`
  - `src/components/admin/dia-manager.tsx`
  - `src/components/admin/ejercicio-list.tsx`
  - `src/components/admin/ejercicio-row.tsx`
  - `src/components/admin/dia-section.tsx`
  - `src/components/admin/delete-rutina-button.tsx`
  - `src/components/admin/delete-rutina-page-button.tsx`
  - `src/components/admin/GymPriceEditor.tsx`
  - `src/app/(admin)/admin/page.tsx`
  - `src/app/(admin)/admin/rutinas/[id]/dias/[diaId]/page.tsx`
- Verify both light and dark modes work correctly

### Out of Scope

- Refactoring non-admin components
- Creating a full design system
- Adding new color palette beyond what's needed for admin panel
- Modifying the component logic (only styling changes)

## Approach

1. **Add CSS variables** to `globals.css` for both `.light` and `.dark` themes:
   - Map existing hardcoded colors to CSS variables following the shadcn/ui pattern
   - Add `--success` (green) and `--success-foreground` for success states
   - Add `--icon-badge-bg` for badge backgrounds

2. **Systematic replacement**: Replace hardcoded colors with CSS variables:
   - `bg-zinc-900` → `bg-[var(--card-bg)]`
   - `text-zinc-50` → `text-[var(--card-foreground)]`
   - `bg-red-500` → `bg-[var(--destructive)]`
   - `text-red-500` → `text-[var(--destructive-foreground)]`
   - etc.

3. **Color mapping**:
   - Use existing `--card-bg`, `--card-border`, `--input-*` variables
   - Use `--destructive`/`--destructive-foreground` for destructive actions (already defined)
   - Use new `--success`/`--success-foreground` for success messages

4. **Testing**: Manually verify admin panel in both light and dark themes after refactoring

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modified | Add `--success`, `--success-foreground`, `--icon-badge-bg` variables |
| `src/components/admin/*.tsx` (9 files) | Modified | Replace hardcoded colors with CSS variables |
| `src/app/(admin)/admin/page.tsx` | Modified | Replace hardcoded colors with CSS variables |
| `src/app/(admin)/admin/rutinas/[id]/dias/[diaId]/page.tsx` | Modified | Replace hardcoded colors with CSS variables |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Destructive actions have slightly different color in dark mode (`--destructive` is not pure red) | Low | Accept as part of consistent theming; user already aware |
| Some light mode colors may still need adjustment | Medium | Test thoroughly; may need additional CSS variable tuning |
| Large scope (11 files) increases chance of missing something | Medium | Systematic approach; test each file individually |

## Rollback Plan

1. Revert all file changes using `git checkout`
2. CSS variables added to `globals.css` can remain (they won't break anything if unused)

```bash
git checkout -- src/components/admin/ src/app/(admin)/admin/
```

## Dependencies

- No external dependencies
- No prerequisite changes needed

## Success Criteria

- [ ] Admin panel renders correctly in dark mode
- [ ] Admin panel renders correctly in light mode
- [ ] All hardcoded dark theme colors (`bg-zinc-*`, `text-zinc-*`, `bg-red-*`, etc.) replaced with CSS variables in affected files
- [ ] Success actions use `--success` variable (green tones)
- [ ] Destructive actions continue to use `--destructive` variable
- [ ] Icon badges use `--icon-badge-bg` variable
- [ ] No TypeScript or ESLint errors introduced
