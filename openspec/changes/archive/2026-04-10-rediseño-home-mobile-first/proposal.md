# Proposal: rediseño-home-mobile-first
## Intent
Redesign the public home page `/` with a mobile-first approach: remove the generic header subtitle, simplify RoutineCard by removing author attribution, replace the desktop-only TrainerSidebar with a mobile Sheet-based bottom drawer, and convert Info/Feriados into a fixed bottom bar on mobile.
## Scope
### In Scope
- Header redesign: remove generic subtitle, keep title + ThemeToggle
- RoutineCard simplification: remove "Creado por [name]" line
- Mobile trainer filter: create Sheet-based bottom drawer triggered by "Filtrar" button
- Mobile bottom bar: Info/Feriados as fixed bottom bar (icon-only)
- Theme audit: verify all components use CSS var tokens (`bg-card`, `text-foreground`, etc.) instead of hardcoded `slate-*`
- Desktop layout: maintain lg+ trainer pills (desktop-only pills replacing sidebar)
### Out of Scope
- Backend changes
- Auth flow modifications
- New search features beyond trainer filtering
- Changes to routine detail pages
## Approach
1. Install shadcn Sheet: `npx shadcn@latest add sheet`
2. Create `TrainerFilterDrawer` component wrapping Sheet with trainer pills
3. Add "Filtrar" button with active badge to `SearchSection` (mobile-only trigger)
4. Convert Info/Feriados to fixed bottom bar on mobile
5. Simplify RoutineCard: remove "Creado por X" display
6. Remove generic subtitle from header
7. Audit all components for theme tokens usage
8. Verify light/dark appearance on all affected components
## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/app/(public)/page.tsx` | Modified | Layout reordering for mobile-first |
| `src/components/routines/routine-card.tsx` | Modified | Remove "Creado por X", simplify display |
| `src/components/search/trainer-sidebar.tsx` | Modified | Desktop-only pills, mobile becomes Sheet trigger |
| `src/components/search/search-section.tsx` | Modified | Desktop header links, mobile bottom bar |
| `src/components/search/trainer-filter-drawer.tsx` | New | Sheet-based bottom drawer for mobile trainer filter |
| `src/app/globals.css` | Modified | Add missing theme tokens if any |
## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| shadcn sheet installation adds unexpected dependencies | Low | Abort and document if peer deps conflict |
| Bottom bar padding overlaps routine grid | Medium | Add `pb-16` to grid container on mobile |
| Theme hardcoding in sidebar requires refactoring | Medium | Audit tokens before implementing components |
## Rollback Plan
- Feature flag: wrap each visual change behind a config flag in `src/config/features.ts`
- Git tag: tag commit before starting (`git tag -a pre-rediseño-mobile-before`)
- If shadcn sheet install fails → abort, do not proceed
- If theme tokens missing → add to `globals.css` before implementing components
## Dependencies
- `npx shadcn@latest add sheet` must succeed before any drawer implementation
- shadcn Sheet component requires `@radix-ui/react-dialog` peer dependency
## Success Criteria
- [ ] Mobile "Filtrar" button opens trainer bottom drawer
- [ ] Info/Feriados appear as fixed bottom bar on mobile, header links on desktop
- [ ] RoutineCard no longer shows "Creado por X"
- [ ] Header shows only title + ThemeToggle (no subtitle)
- [ ] All affected components render correctly in light AND dark mode
- [ ] Desktop lg+ layout shows trainer pills (replacing sidebar)