# Tasks: Admin Theme CSS Variables

## Phase 1: CSS Variables Foundation

- [x] 1.1 Add `--success` and `--success-foreground` CSS variables to `app/globals.css` (use green-500 and green-50 values matching existing color pattern)
- [x] 1.2 Add `--icon-badge-bg` CSS variable to `app/globals.css` (optional, for icon backgrounds)

## Phase 2: Admin Component Refactoring

### Rutina Form
- [x] 2.1 Replace hardcoded success colors in `components/admin/rutina-form.tsx` with CSS variables

### Ejercicio Form
- [x] 2.2 Replace hardcoded success colors in `components/admin/ejercicio-form.tsx` with CSS variables

### Dia Manager
- [x] 2.3 Replace hardcoded success/icon colors in `components/admin/dia-manager.tsx` with CSS variables

### Ejercicio List & Row
- [x] 2.4 Replace hardcoded colors in `components/admin/ejercicio-list.tsx` with CSS variables
- [x] 2.5 Replace hardcoded colors in `components/admin/ejercicio-row.tsx` with CSS variables

### Dia Section
- [x] 2.6 Replace hardcoded colors in `components/admin/dia-section.tsx` with CSS variables

### Delete Buttons
- [x] 2.7 Replace hardcoded danger colors in `components/admin/delete-rutina-button.tsx` with CSS variables
- [x] 2.8 Replace hardcoded danger colors in `components/admin/delete-rutina-page-button.tsx` with CSS variables

### GymPriceEditor
- [x] 2.9 Replace hardcoded success colors in `components/admin/GymPriceEditor.tsx` with CSS variables

## Phase 3: Admin Pages Refactoring

- [x] 3.1 Replace hardcoded colors in `src/app/(admin)/admin/rutinas/[id]/dias/[diaId]/page.tsx` with CSS variables
- [x] 3.2 Replace hardcoded colors in `src/app/(admin)/admin/page.tsx` with CSS variables
- [x] 3.3 Translate Chinese text "部分数据无法完全加载。显示的是缓存值。" to Spanish "No se pudieron cargar algunos datos. Se muestran valores en caché."

## Phase 4: Verification

- [ ] 4.1 Run `grep -r "green-" components/admin/` to verify no remaining hardcoded green colors
- [ ] 4.2 Run `grep -r "red-" components/admin/` to verify no remaining hardcoded red colors (except intentional danger buttons)
- [ ] 4.3 Verify light mode appearance matches dark mode for all changed components
- [ ] 4.4 Verify all UI text is in Spanish (no English labels, placeholders, error messages, tooltips)

## Notes

- This is a VISUAL refactor ONLY — no logic changes
- CSS variables should follow existing pattern: `--{color-name}` and `--{color-name}-foreground`
- Use green-500/green-50 for success theme, matching shadcn/ui conventions
- All user-facing strings MUST be in Spanish
