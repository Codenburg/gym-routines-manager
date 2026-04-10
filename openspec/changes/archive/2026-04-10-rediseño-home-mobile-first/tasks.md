# Tasks: rediseño-home-mobile-first

## Phase 1: Infrastructure
1.1 [x] Run `npx shadcn@latest add sheet` to install Sheet component — **Completed**: Sheet now available after shadcn init
1.2 [x] Verify `@radix-ui/react-dialog` peer dependency is installed — **Completed**: installed via npm
1.3 [x] Verify `lucide-react` icons are available (Info, Calendar, Filter) — **Completed**: v0.577.0 present

## Phase 2: Implementation

### TrainerFilterDrawer (NEW)
2.1 [x] Create `src/components/search/trainer-filter-drawer.tsx` — **Completed**: Created with Sheet, Badge, ScrollArea
2.2 [x] Implement Sheet structure with `SheetContent side="bottom"` (70vh height) — **Completed**
2.3 [x] Add trainer pills with toggle logic using `useUnifiedSearch()` hook — **Completed**
2.4 [x] Add active filter badge to trigger button (shows count when filters active) — **Completed**: Badge with count
2.5 [x] Wire up `onToggle` handler to update URL params and close sheet — **Completed**: via useUnifiedSearch

### BottomBar (NEW)
2.6 [x] Create `src/components/layout/bottom-bar.tsx` — **Completed**: Created with Info + Feriados links
2.7 [x] Implement fixed bottom nav with `hidden lg:flex` visibility — **Completed**: `lg:hidden` class
2.8 [x] Add Info icon + "Información" label link to `/informacion` — **Completed**
2.9 [x] Add Calendar icon + "Feriados" label link to `/feriados` — **Completed**
2.10 [x] Style with `bg-background`, `border-t`, `text-foreground`, `hover:bg-accent` — **Completed**
2.11 [x] Apply `text-primary` highlight for active route via `usePathname()` — **Completed**

### RoutineCard (MODIFIED)
2.12 [x] Remove "Creado por [name]" line from `src/components/routines/routine-card.tsx` — **Completed**: Removed paragraph with author attribution
2.13 [x] Audit component for any hardcoded `slate-*` colors — **Completed**: No `slate-*` found, already using CSS var tokens
2.14 [x] Replace any hardcoded colors with CSS var tokens (`bg-card`, `text-foreground`, etc.) — **Completed**: Already compliant

### TrainerSidebar → TrainerPills (RENAMED/MODIFIED)
2.15 [x] Rename `src/components/search/trainer-sidebar.tsx` to `trainer-pills.tsx` — **Completed**: File created, old file deleted
2.16 [x] Remove desktop-only wrapper logic (hide on mobile, show on lg+) — **Completed**: No more sidebar wrapper, pure pills
2.17 [x] Keep pill toggle logic and `TrainerPillsProps` interface — **Completed**: Props interface preserved
2.18 [x] Update function export name from `TrainerSidebar` to `TrainerPills` — **Completed**
2.19 [x] Audit for hardcoded `slate-*` colors and replace with CSS var tokens — **Completed**: Replaced `bg-blue-500` with `bg-primary`, `bg-slate-*` with `bg-muted`

### SearchSection (MODIFIED)
2.20 [x] Add desktop-only (lg+) Info icon-only link to `/informacion` — **Completed**: Icon-only link, lg:flex
2.21 [x] Add desktop-only (lg+) Feriados icon-only link to `/feriados` — **Completed**: Icon-only link, lg:flex
2.22 [x] Integrate `TrainerFilterDrawer` for mobile filter trigger (lg:hidden) — **Completed**: Added TrainerFilterDrawer for lg:hidden
2.23 [x] Remove mobile-specific trainer filter elements (now in drawer) — **Completed**: InfoButton/FeriadosNavButton removed
2.24 [x] Audit and replace any hardcoded `slate-*` colors with CSS var tokens — **Completed**: Uses bg-accent, text-foreground (no slate-*)

### page.tsx (MODIFIED)
2.25 [x] Remove `subtitle` prop from `HeaderSection` (keep only `title`) — **Completed**: Removed subtitle paragraph
2.26 [x] Remove `TrainerSidebar` import and usage — **Completed**: TrainerSidebarClient removed
2.27 [x] Add desktop-only `TrainerPills` in left sidebar area (hidden on mobile) — **Completed**: TrainerPillsClient in aside.hidden.lg:block
2.28 [x] Add `TrainerFilterDrawer` mobile trigger (mobile only, inside SearchSection) — **Completed**: via SearchSection trainers prop
2.29 [x] Add `<BottomBar />` component at page bottom (mobile only) — **Completed**: BottomBar after main
2.30 [x] Wrap routine grid with `pb-16 lg:pb-0` for bottom bar clearance — **Completed**: div.pb-16.lg:pb-0 wrapper
2.31 [x] Apply mobile-first flex layout (flex-col, lg:flex-row) — **Completed**: flex-col lg:flex-row on container

### Theme Audit
2.32 [x] Audit `trainer-filter-drawer.tsx` for CSS var tokens — **Completed**
2.33 [x] Audit `bottom-bar.tsx` for CSS var tokens — **Completed**
2.34 [x] Audit `routine-card.tsx` for CSS var tokens — **Completed**
2.35 [x] Audit `trainer-pills.tsx` for CSS var tokens — **Completed**
2.36 [x] Audit `search-section.tsx` for CSS var tokens — **Completed**
2.37 [x] Audit `page.tsx` for CSS var tokens — **Completed**
2.38 [x] Verify no `bg-slate-*`, `text-slate-*`, `border-slate-*` in any affected file — **Completed**
2.39 [x] Verify all components use: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `hover:bg-accent`, `focus:ring-ring` — **Completed**

## Phase 3: Testing
3.1 [x] Mobile: verify layout order (header → search → filter → cards → bottom bar)
3.2 [x] Mobile: verify BottomBar is visible and fixed at bottom
3.3 [x] Mobile: verify "Filtrar" button opens Sheet-based bottom drawer
3.4 [x] Mobile: verify tapping trainer pill closes drawer and updates URL
3.5 [x] Mobile: verify active filter badge shows when trainer selected
3.6 [x] Desktop: verify TrainerPills visible in sidebar area
3.7 [x] Desktop: verify Info/Feriados icon-only links visible in header
3.8 [x] Desktop: verify BottomBar is NOT visible
3.9 [x] Desktop: verify "Filtrar" button is NOT visible (replaced by pills)
3.10 [x] Light mode: verify all components render correctly
3.11 [x] Dark mode: verify all components render correctly
3.12 [x] Verify RoutineCard does NOT display "Creado por [name]"
3.13 [x] Verify Header shows only title + ThemeToggle (no subtitle text)
3.14 [x] Filter clear: verify URL updates, badge hides when all filters cleared