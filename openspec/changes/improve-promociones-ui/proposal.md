# Proposal: improve-promociones-ui

## Intent

La sección Promociones en `/informacion` muestra precios sin formato visual (raw `47000` vs `$47.000`), sin jerarquía visual adecuada. Este cambio aplica el patrón visual de `admin/promocion-card` — borde accent + Badge — para consistencia con el resto del admin.

## Scope

### In Scope
- `src/components/informacion/PlansSection.tsx` — add `border-l-4 border-l-primary` a Card
- `src/components/informacion/PlansSection.tsx` — import `Badge`, envolver precio en `<Badge bg-primary/10 text-primary>`
- `src/components/informacion/PlansSection.tsx` — agregar `formatPriceARS` inline (minimal approach)

### Out of Scope
- Refactor `formatPriceARS` a utils compartido (duplication exists in 4 places but out of scope)
- Changes to admin `promocion-card.tsx`
- Changes to schema or data layer

## Approach

Minimal approach — copy pattern from `admin/promocion-card.tsx`:
1. Add `border-l-4 border-l-primary` + `border` classes to the Card
2. Import `Badge` from `@/components/ui/badge`
3. Wrap price with `<Badge className="bg-primary/10 text-primary mt-1">`
4. Inline `formatPriceARS` helper in the same file

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/informacion/PlansSection.tsx` | Modified | Visual polish only — no logic changes |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Format inconsistency if `formatPriceARS` logic changes | Low | Document inline; refactor to utils in separate change |
| Badge variant mismatch | Low | Use `bg-primary/10 text-primary` confirmed in exploracion |

## Rollback Plan

Revert `PlansSection.tsx` to previous version via git:
```bash
git checkout HEAD~1 -- src/components/informacion/PlansSection.tsx
```

## Dependencies

- `Badge` component already installed via shadcn
- `Card` component already in use

## Success Criteria

- [ ] Price displays as `$47.000` not `47000`
- [ ] Card has `border-l-4 border-l-primary` accent on left
- [ ] Price wrapped in Badge with `bg-primary/10 text-primary`
- [ ] No console errors on `/informacion` page
