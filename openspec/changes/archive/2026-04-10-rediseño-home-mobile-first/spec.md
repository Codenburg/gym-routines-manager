# SPEC: rediseño-home-mobile-first

## 1. Overview

This delta spec covers the mobile-first redesign of the public home page `/`. All scenarios use Given/When/Then format. Normative statements use RFC 2119 keywords (MUST, SHALL, SHOULD, MAY).

---

## 2. Feature Area: Header

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

### Scenario: ThemeToggle works in both themes
**Given** the user is on the home page `/`  
**When** the user clicks the ThemeToggle button  
**Then** the theme SHALL switch between light and dark modes  
**And** all affected components SHALL render correctly after theme switch

---

## 3. Feature Area: RoutineCard

### Scenario: Card displays correctly on mobile
**Given** the user is viewing the home page `/` on a mobile viewport  
**When** the routine cards are rendered in the grid  
**Then** each card SHALL fit within the mobile viewport width  
**And** card content SHALL NOT overflow horizontally

### Scenario: Card displays correctly on desktop
**Given** the user is viewing the home page `/` on a desktop viewport (width ≥ 1024px)  
**When** the routine cards are rendered in the grid  
**Then** each card SHALL display in a multi-column grid layout  
**And** card content SHALL NOT overflow horizontally

### Scenario: Card shows title, tipo badge, days, description — NO author attribution
**Given** the user is viewing the home page `/`  
**When** the routine cards are rendered  
**Then** each card SHALL display: routine title, tipo badge, dias/semanas info, and description  
**And** each card SHALL NOT display any "Creado por [name]" line or author attribution

### Scenario: Card renders in light mode
**Given** the site theme is set to light mode  
**When** the user views the home page `/`  
**Then** all routine cards SHALL use CSS var tokens for backgrounds and text (`bg-card`, `text-foreground`, etc.)  
**And** NO hardcoded `slate-*` colors SHALL be present in card components

### Scenario: Card renders in dark mode
**Given** the site theme is set to dark mode  
**When** the user views the home page `/`  
**Then** all routine cards SHALL use CSS var tokens for backgrounds and text  
**And** the cards SHALL maintain proper contrast and legibility in dark mode

---

## 4. Feature Area: Mobile Trainer Filter Drawer

### Scenario: User taps "Filtrar" button on mobile
**Given** the user is on the home page `/` on a mobile viewport (width < 1024px)  
**When** the user taps the "Filtrar" button in the SearchSection  
**Then** a bottom Sheet drawer SHALL open  
**And** the drawer SHALL display trainer filter options

### Scenario: Drawer shows trainer pills
**Given** the user has opened the trainer filter drawer on mobile  
**When** the drawer is fully open  
**Then** the drawer SHALL display a list of trainer pills (same data as desktop sidebar)  
**And** each pill SHALL be tappable/selectable

### Scenario: User selects a trainer, drawer closes, filter is active
**Given** the user has the trainer filter drawer open on mobile  
**When** the user taps a trainer pill  
**Then** the drawer SHALL close automatically  
**And** the URL search params SHALL be updated to include the selected trainer filter  
**And** the "Filtrar" button SHALL display an active badge indicator

### Scenario: "Filtrar" button shows active badge when filter selected
**Given** a trainer filter is active (via URL search params)  
**When** the user views the SearchSection on mobile  
**Then** the "Filtrar" button SHALL display a visual badge indicating an active filter  
**And** the badge SHALL be visible without requiring the user to open the drawer

### Scenario: User clears all filters
**Given** a trainer filter is currently active on mobile  
**When** the user opens the drawer and taps the "clear all" or deselects all trainers  
**Then** the URL search params SHALL be updated to remove the trainer filter  
**And** the "Filtrar" button SHALL NOT display the active badge  
**And** all routines SHALL be shown without trainer filtering

### Scenario: Drawer renders in light AND dark mode
**Given** the site theme is set to light mode  
**When** the user opens the trainer filter drawer on mobile  
**Then** the drawer SHALL render with proper light mode styling using CSS var tokens

**Given** the site theme is set to dark mode  
**When** the user opens the trainer filter drawer on mobile  
**Then** the drawer SHALL render with proper dark mode styling using CSS var tokens

---

## 5. Feature Area: Desktop Trainer Pills

### Scenario: User sees pills on desktop (lg+)
**Given** the user is on the home page `/` on a desktop viewport (width ≥ 1024px)  
**When** the page loads  
**Then** trainer pills SHALL be displayed above the routine grid (replacing the TrainerSidebar)  
**And** the pills SHALL be visible without requiring any user interaction

### Scenario: User can select/deselect trainer pills on desktop
**Given** the user is on the home page `/` on a desktop viewport  
**When** the user clicks a trainer pill  
**Then** the URL search params SHALL be updated to reflect the selected trainer  
**When** the user clicks the same trainer pill again  
**Then** the trainer SHALL be deselected and the URL updated accordingly

### Scenario: Pills reflect current URL state
**Given** the home page `/` has trainer filter params in the URL  
**When** the page loads on desktop  
**Then** the trainer pills SHALL show the correct selected state matching the URL params

---

## 6. Feature Area: Info/Feriados Bottom Bar (Mobile)

### Scenario: Fixed bottom bar appears on mobile
**Given** the user is on the home page `/` on a mobile viewport (width < 1024px)  
**When** the page loads  
**Then** a fixed bottom bar SHALL be visible at the bottom of the viewport  
**And** the bottom bar SHALL NOT be visible on desktop viewports

### Scenario: Bottom bar shows Info icon + "Información" label
**Given** the user is on the home page `/` on mobile  
**When** the bottom bar is rendered  
**Then** the bottom bar SHALL display an Info icon with the label "Información"

### Scenario: Bottom bar shows Feriados icon + "Feriados" label
**Given** the user is on the home page `/` on mobile  
**When** the bottom bar is rendered  
**Then** the bottom bar SHALL display a Feriados icon with the label "Feriados"

### Scenario: Bottom bar renders in light AND dark mode
**Given** the site theme is set to light mode  
**When** the user views the home page `/` on mobile  
**Then** the bottom bar SHALL render with proper light mode styling using CSS var tokens

**Given** the site theme is set to dark mode  
**When** the user views the home page `/` on mobile  
**Then** the bottom bar SHALL render with proper dark mode styling using CSS var tokens

### Scenario: Bottom bar does NOT appear on desktop
**Given** the user is on the home page `/` on a desktop viewport (width ≥ 1024px)  
**When** the page loads  
**Then** the fixed bottom bar SHALL NOT be rendered or displayed

---

## 7. Feature Area: Info/Feriados Header Links (Desktop)

### Scenario: Header shows discrete icon links on desktop
**Given** the user is on the home page `/` on a desktop viewport (width ≥ 1024px)  
**When** the page loads  
**Then** the header SHALL display discrete icon-only links for Info and Feriados  
**And** these links SHALL be positioned appropriately in the header area

### Scenario: Links render in light AND dark mode
**Given** the site theme is set to light mode  
**When** the user views the header on desktop  
**Then** the Info/Feriados icon links SHALL render with proper light mode styling

**Given** the site theme is set to dark mode  
**When** the user views the header on desktop  
**Then** the Info/Feriados icon links SHALL render with proper dark mode styling

### Scenario: Links do NOT appear on mobile
**Given** the user is on the home page `/` on a mobile viewport  
**When** the page loads  
**Then** the Info/Feriados header links SHALL NOT be rendered or displayed

---

## 8. Feature Area: Mobile Layout Order

### Scenario: Mobile layout order is header → search → filter button → cards → bottom bar
**Given** the user is on the home page `/` on a mobile viewport  
**When** the page renders  
**Then** the visual order from top to bottom SHALL be: Header, SearchSection (with trainer filter button), RoutineCard grid, Bottom Bar

### Scenario: Content does not overlap with bottom bar
**Given** the user is on the home page `/` on a mobile viewport  
**When** the page renders  
**Then** the routine card grid SHALL have bottom padding of at least `pb-16` (or equivalent) to prevent overlap with the fixed bottom bar

---

## 9. Feature Area: Theme Consistency

### Scenario: All affected components use CSS var tokens (bg-card, text-foreground, etc.)
**Given** the components affected by this change  
**When** they are rendered  
**Then** they SHALL use CSS custom property tokens for all colors (`bg-card`, `text-foreground`, `border`, `text-muted-foreground`, etc.)  
**And** NO inline hardcoded color values SHALL be used in affected component files

### Scenario: No hardcoded slate-* colors in affected components
**Given** the following files are modified as part of this change:
- `src/app/(public)/page.tsx`
- `src/components/routines/routine-card.tsx`
- `src/components/search/trainer-sidebar.tsx`
- `src/components/search/search-section.tsx`
- `src/components/search/trainer-filter-drawer.tsx`
- `src/app/globals.css`

**When** these files are reviewed or rendered  
**Then** NO hardcoded `slate-*` color values SHALL be present

### Scenario: Light theme renders correctly
**Given** the site theme is set to light mode  
**When** the user views the home page `/`  
**Then** all affected components SHALL render with correct light theme styling

### Scenario: Dark theme renders correctly
**Given** the site theme is set to dark mode  
**When** the user views the home page `/`  
**Then** all affected components SHALL render with correct dark theme styling

---

## 10. Acceptance Criteria (Summary)

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-01 | Header shows only title + ThemeToggle on both mobile and desktop | Visual inspection |
| AC-02 | RoutineCard does NOT display "Creado por [name]" | Visual inspection |
| AC-03 | "Filtrar" button opens Sheet-based bottom drawer on mobile | Manual interaction test |
| AC-04 | Trainer pill selection updates URL params | URL inspection after selection |
| AC-05 | Active filter badge shows on "Filtrar" button when filter active | Visual inspection |
| AC-06 | Desktop shows trainer pills (lg+), not sidebar | Visual inspection |
| AC-07 | Mobile bottom bar shows Info + Feriados with icons and labels | Visual inspection |
| AC-08 | Desktop header shows Info + Feriados icon-only links | Visual inspection |
| AC-09 | Bottom bar does NOT appear on desktop viewport | Responsive test |
| AC-10 | Header links do NOT appear on mobile viewport | Responsive test |
| AC-11 | Mobile layout order: header → search → filter → cards → bottom bar | Visual inspection |
| AC-12 | Card grid has `pb-16` or equivalent bottom padding on mobile | Layout inspection |
| AC-13 | All affected components use CSS var tokens, no hardcoded slate-* | Code review |
| AC-14 | Light mode renders correctly | Manual theme switch |
| AC-15 | Dark mode renders correctly | Manual theme switch |

---

## 11. Dependencies

- `npx shadcn@latest add sheet` MUST succeed before drawer implementation
- shadcn Sheet component requires `@radix-ui/react-dialog` as peer dependency
- All theme tokens MUST be defined in `src/app/globals.css` before component implementation

---

## 12. Out-of-Scope Boundaries

The following are NOT affected by this change:
- Backend API or database changes
- Authentication flow or protected routes
- Routine detail page `/routines/[id]`
- Search functionality beyond trainer filtering
- Any changes to shadcn Sheet component internals