# SPEC: rediseño-home-mobile-first (Delta)

## Feature Area: Header

### Scenario: User sees header on mobile
**Given** the user is on the home page `/` on a mobile viewport (width < 1024px)  
**When** the page loads  
**Then** the header SHALL display only the page title and the ThemeToggle component  
**And** the header SHALL NOT display any generic subtitle text

### Scenario: User sees header on desktop
**Given** the user is on the home page `/` on a desktop viewport (width ≥ 1024px)  
**When** the page loads  
**Then** the header SHALL display only the page title and the ThemeToggle component  
**And** the header SHALL NOT display any generic subtitle text

---

## Feature Area: RoutineCard

### Scenario: Card shows title, tipo badge, days, description — NO author attribution
**Given** the user is viewing the home page `/`  
**When** the routine cards are rendered  
**Then** each card SHALL display: routine title, tipo badge, dias/semanas info, and description  
**And** each card SHALL NOT display any "Creado por [name]" line or author attribution

---

## Feature Area: Mobile Trainer Filter Drawer

### Scenario: User taps "Filtrar" button on mobile
**Given** the user is on the home page `/` on a mobile viewport (width < 1024px)  
**When** the user taps the "Filtrar" button in the SearchSection  
**Then** a bottom Sheet drawer SHALL open  
**And** the drawer SHALL display trainer filter options

### Scenario: "Filtrar" button shows active badge when filter selected
**Given** a trainer filter is active (via URL search params)  
**When** the user views the SearchSection on mobile  
**Then** the "Filtrar" button SHALL display a visual badge indicating an active filter

---

## Feature Area: Desktop Trainer Pills

### Scenario: User sees pills on desktop (lg+)
**Given** the user is on the home page `/` on a desktop viewport (width ≥ 1024px)  
**When** the page loads  
**Then** trainer pills SHALL be displayed above the routine grid (replacing the TrainerSidebar)  
**And** the pills SHALL be visible without requiring any user interaction

---

## Feature Area: Info/Feriados Bottom Bar (Mobile)

### Scenario: Fixed bottom bar appears on mobile
**Given** the user is on the home page `/` on a mobile viewport (width < 1024px)  
**When** the page loads  
**Then** a fixed bottom bar SHALL be visible at the bottom of the viewport  
**And** the bottom bar SHALL NOT be visible on desktop viewports

### Scenario: Bottom bar does NOT appear on desktop
**Given** the user is on the home page `/` on a desktop viewport (width ≥ 1024px)  
**When** the page loads  
**Then** the fixed bottom bar SHALL NOT be rendered or displayed

---

## Feature Area: Info/Feriados Header Links (Desktop)

### Scenario: Header shows discrete icon links on desktop
**Given** the user is on the home page `/` on a desktop viewport (width ≥ 1024px)  
**When** the page loads  
**Then** the header SHALL display discrete icon-only links for Info and Feriados

### Scenario: Links do NOT appear on mobile
**Given** the user is on the home page `/` on a mobile viewport  
**When** the page loads  
**Then** the Info/Feriados header links SHALL NOT be rendered or displayed

---

## Feature Area: Mobile Layout Order

### Scenario: Content does not overlap with bottom bar
**Given** the user is on the home page `/` on a mobile viewport  
**When** the page renders  
**Then** the routine card grid SHALL have bottom padding of at least `pb-16` (or equivalent) to prevent overlap with the fixed bottom bar

---

## Feature Area: Theme Consistency

### Scenario: No hardcoded slate-* colors in affected components
**Given** the following files are modified as part of this change:
- `src/app/(public)/page.tsx`
- `src/components/routines/routine-card.tsx`
- `src/components/search/trainer-sidebar.tsx` → `trainer-pills.tsx`
- `src/components/search/search-section.tsx`
- `src/components/search/trainer-filter-drawer.tsx`
- `src/components/layout/bottom-bar.tsx`

**When** these files are reviewed or rendered  
**Then** NO hardcoded `slate-*` color values SHALL be present

---

## Acceptance Criteria (Summary)

| ID | Criterion |
|----|-----------|
| AC-01 | Header shows only title + ThemeToggle on both mobile and desktop |
| AC-02 | RoutineCard does NOT display "Creado por [name]" |
| AC-03 | "Filtrar" button opens Sheet-based bottom drawer on mobile |
| AC-04 | Trainer pill selection updates URL params |
| AC-05 | Active filter badge shows on "Filtrar" button when filter active |
| AC-06 | Desktop shows trainer pills (lg+), not sidebar |
| AC-07 | Mobile bottom bar shows Info + Feriados with icons and labels |
| AC-08 | Desktop header shows Info + Feriados icon-only links |
| AC-09 | Bottom bar does NOT appear on desktop viewport |
| AC-10 | Header links do NOT appear on mobile viewport |
| AC-11 | Mobile layout order: header → search → filter → cards → bottom bar |
| AC-12 | Card grid has `pb-16` or equivalent bottom padding on mobile |
| AC-13 | All affected components use CSS var tokens, no hardcoded slate-* |
| AC-14 | Light mode renders correctly |
| AC-15 | Dark mode renders correctly |