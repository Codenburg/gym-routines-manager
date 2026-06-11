# Homepage UI Specification

## Purpose

This specification defines the behavior and requirements for the gym routines manager homepage MVP. The homepage displays a list of available workout routines with basic search functionality, providing users with their first interaction point with the application.

## Data Model

The system MUST use the following Prisma schema for the `Rutina` model:

```prisma
model Rutina {
  id          String   @id @default(uuid())
  nombre      String
  tipo        String
  descripcion String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  dias        Dia[]
}

model Dia {
  id                String     @id @default(uuid())
  rutinaId          String
  nombre            String
  musculosEnfocados String?
  orden             Int        @default(0)
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  rutina            Rutina     @relation(fields: [rutinaId], references: [id], onDelete: Cascade)
  ejercicios        Ejercicio[]
}
```

---

## API Endpoint Requirements

### Requirement: GET /api/rutinas Endpoint

The system SHALL provide a REST API endpoint at `GET /api/rutinas` that returns a list of routines from the database.

The endpoint MUST accept an optional `search` query parameter for filtering routines by name.

#### Scenario: Fetch all routines without search filter

- GIVEN the database contains at least one Rutina record
- WHEN a client sends a GET request to `/api/rutinas` without query parameters
- THEN the response status code SHALL be 200
- AND the response body SHALL be a JSON array containing all Rutina records
- AND each Rutina object SHALL include `id`, `nombre`, `tipo`, `descripcion`, `createdAt`, and `updatedAt`

#### Scenario: Filter routines by search query

- GIVEN the database contains routines with names "Rutina A", "Rutina B", and "Rutina C"
- WHEN a client sends a GET request to `/api/rutinas?search=Rutina%20A"
- THEN the response status code SHALL be 200
- AND the response body SHALL contain only routines whose `nombre` field contains the search term (case-insensitive)
- AND routines that do not match the search term SHALL NOT be included in the response

#### Scenario: Empty search results

- GIVEN the database contains no routines with "nonexistent" in the name
- WHEN a client sends a GET request to `/api/rutinas?search=nonexistent"
- THEN the response status code SHALL be 200
- AND the response body SHALL be an empty JSON array `[]`

#### Scenario: Search with empty string

- GIVEN the database contains at least one Rutina record
- WHEN a client sends a GET request to `/api/rutinas?search="
- THEN the response SHALL behave as if no search filter was provided
- AND all routines SHALL be returned

#### Scenario: Database connection failure

- GIVEN the database is unavailable or connection fails
- WHEN a client sends a GET request to `/api/rutinas"
- THEN the response status code SHALL be 500
- AND the response body SHALL contain an error message indicating the service is unavailable

---

## UI Component Requirements

### Requirement: RoutineCard Component

The system SHALL provide a reusable `RoutineCard` component that displays routine information.

The component MUST display: routine name, routine type, description (if available), and the number of days in the routine.

#### Scenario: Display routine with full information

- GIVEN a Rutina object with nombre="Full Body", tipo="Fuerza", descripcion="Rutina completa", and 5 associated Dia records
- WHEN the RoutineCard component renders
- THEN the card SHALL display "Full Body" as the title
- AND SHALL display "Fuerza" as the type badge
- AND SHALL display "Rutina completa" as the description
- AND SHALL display "5 días" indicating the number of days

#### Scenario: Display routine without description

- GIVEN a Rutina object with nombre="Upper Body", tipo="Hipertrofia", and no description
- WHEN the RoutineCard component renders
- THEN the card SHALL display "Upper Body" as the title
- AND SHALL display "Hipertrofia" as the type badge
- AND SHALL NOT display a description field or empty description text

#### Scenario: RoutineCard hover interaction

- GIVEN a RoutineCard is rendered and visible
- WHEN the user hovers over the card
- THEN the card SHALL have a visual hover state (e.g., slight elevation, border color change)
- AND the cursor SHALL change to indicate clickability

#### Scenario: Single day routine display

- GIVEN a Rutina object with 1 associated Dia record
- WHEN the RoutineCard component renders
- THEN the day count SHALL display "1 día" (singular form)

---

### Requirement: RoutineList Component

The system SHALL provide a `RoutineList` component that displays a grid of RoutineCard components.

The list MUST be responsive: 1 column on mobile, 2 columns on tablet, 3 columns on desktop.

#### Scenario: Display multiple routines in grid

- GIVEN an array of 6 Rutina objects
- WHEN the RoutineList component renders
- THEN 6 RoutineCard components SHALL be displayed
- AND on mobile viewport, cards SHALL be arranged in 1 column
- AND on tablet viewport (≥640px), cards SHALL be arranged in 2 columns
- AND on desktop viewport (≥1024px), cards SHALL be arranged in 3 columns

#### Scenario: Empty routine list

- GIVEN an empty array of routines
- WHEN the RoutineList component renders
- THEN an appropriate empty state message SHALL be displayed
- AND the message SHALL indicate no routines are available

#### Scenario: List renders with proper spacing

- GIVEN RoutineList is rendering multiple cards
- THEN each card SHALL have consistent spacing (gap) between adjacent cards
- AND the spacing SHALL be visually balanced both horizontally and vertically

---

### Requirement: SearchBar Component

The system SHALL provide a `SearchBar` component that allows users to input search queries.

The component MUST update the URL query parameter when the user submits a search.

#### Scenario: Submit search query

- GIVEN the SearchBar component is rendered with an empty search field
- WHEN the user types "Chest" into the input and submits the form
- THEN the browser URL SHALL update to include `?search=Chest`
- AND the page SHALL refresh/fetch with the new search parameter

#### Scenario: Search with special characters

- GIVEN the SearchBar component is rendered
- WHEN the user types "Rutina de Piernas" (with spaces) and submits
- THEN the URL SHALL encode the space as %20 or use standard URL encoding
- AND the API request SHALL correctly receive the decoded search term

#### Scenario: Clear search

- GIVEN the URL currently has `?search=test" parameter
- WHEN the user clears the search input and submits an empty string
- THEN the URL SHALL remove the search parameter
- AND the full list of routines SHALL be displayed

#### Scenario: Search input placeholder

- GIVEN the SearchBar component is rendered
- THEN the input field SHALL display placeholder text
- AND the placeholder SHALL indicate the search functionality (e.g., "Buscar rutinas...")

---

## Page Requirements

### Requirement: Homepage Server Component

The homepage (`app/page.tsx`) SHALL be implemented as a Next.js Server Component that fetches and displays routines.

The component MUST use React 19's `use()` hook to consume promises directly.

#### Scenario: Homepage loads with all routines

- GIVEN the database contains routine records
- WHEN the user navigates to the homepage (/)
- THEN the page SHALL fetch all routines from the API
- AND display them using the RoutineList component
- AND the SearchBar SHALL be visible at the top of the page

#### Scenario: Homepage loads with search results

- GIVEN the user previously searched for "Legs"
- WHEN the user reloads the page or navigates to /?search=Legs
- THEN the page SHALL fetch routines filtered by "Legs"
- AND display the filtered results in the RoutineList
- AND the SearchBar SHALL show "Legs" as the current search value

---

## Loading State Requirements

### Requirement: Suspense Loading State

The system SHALL implement loading states using Next.js route-group-level `loading.tsx` files. The canonical homepage loading UI MUST be the `src/app/(public)/loading.tsx` file, which renders a homepage-shaped skeleton (header + search input + trainer pills + 6-card routine grid) that matches the visual structure of the real homepage. The root `src/app/loading.tsx` MUST be a generic branded spinner fallback that only applies to routes without a co-located `loading.tsx`.
(Previously: The system had a single `src/app/loading.tsx` rendered for every route, hard-wired to the homepage shape; this caused wrong-shaped skeletons to appear on admin pages, detail pages, and the auth gate.)

#### Scenario: Display loading skeletons on the home route

- GIVEN the user navigates to the homepage
- WHEN the routines data is being fetched
- THEN the `(public)/loading.tsx` skeleton MUST be displayed (NOT the root generic spinner)
- AND the skeleton MUST mimic the homepage layout: header, search input, trainer pills, and a 3-column grid of 6 RoutineCard-shaped placeholders
- AND the placeholders MUST use the `<Skeleton>` UI primitive

#### Scenario: Loading state transitions to content

- GIVEN the user navigates to the homepage and the `(public)/loading.tsx` skeleton is displayed
- WHEN the routine data finishes loading
- THEN the skeleton MUST be replaced with the actual RoutineCard components
- AND the transition MUST be smooth without layout shift

#### Scenario: Loading component structure

- GIVEN the `src/app/(public)/loading.tsx` file exists
- WHEN it is rendered by Next.js
- THEN it MUST export a default component
- AND the component MUST use the same grid layout as the RoutineList
- AND the skeleton cards MUST have the same dimensions as actual cards

#### Scenario: Root loading is a generic fallback only

- GIVEN a route has its own co-located `loading.tsx` (e.g. `(admin)/admin/loading.tsx`, `(public)/feriados/loading.tsx`)
- WHEN that route is in flight
- THEN the root `src/app/loading.tsx` MUST NOT be rendered
- AND the co-located `loading.tsx` MUST be rendered instead
- AND the root loading file MUST contain only a generic branded `DumbbellSpinner` (no page-shape assumptions)

---

## ADDED Requirements (Page Loading Overhaul — v0.18.0)

### Requirement: Homepage Suspense Split for Header-First Streaming

The homepage Server Component MUST wrap the slow data reads (`trainerCounts` and `gymName`) in `<Suspense>` boundaries so that the page shell (page title, theme toggle, search input) renders immediately. The streaming subtrees (trainer pills, gym name resolution) MUST render their own skeleton fallback while in flight.

#### Scenario: Header renders before trainer counts resolve

- GIVEN the user navigates to the homepage
- WHEN the page is requested
- THEN the page shell (title + theme toggle + search input) MUST render in the first streamed chunk
- AND the trainer pills consumer MUST be wrapped in `<Suspense fallback={<SkeletonPills/>}>`
- AND the gym name resolution MUST be wrapped in `<Suspense fallback={...}>`
- AND only after those subtrees resolve MUST the trainer pills and gym name appear

#### Scenario: Suspense fallback matches eventual content shape

- GIVEN the trainer pills consumer is inside a Suspense boundary
- WHEN the fallback is rendered
- THEN the fallback MUST be a row of `<Skeleton>` pills matching the visual width of the real trainer pills
- AND the fallback MUST NOT cause a layout shift when the real pills stream in

#### Scenario: Suspense does not break search state

- GIVEN the user is on the homepage with `?search=foo` in the URL
- WHEN the page streams
- THEN the search value MUST be reflected in the search input from the first chunk (NOT a placeholder)
- AND the search-driven `<Suspense>` subtree (routine list) MUST continue to use the existing Suspense boundary

### Requirement: Homepage Generic Spinner Fallback

The root `src/app/loading.tsx` file MUST render a generic branded `DumbbellSpinner` (centered, `min-h-screen`, `bg-background`) — and MUST NOT include any page-shape assumptions (no header, no search, no grid). The root loading is the fallback only for routes that do not have their own co-located `loading.tsx`.

#### Scenario: Root loading renders generic spinner

- GIVEN a route has no co-located `loading.tsx` (e.g. 404 boundary, very deep segment, or a future route that was forgotten)
- WHEN Next.js needs a loading UI for that route
- THEN the root `src/app/loading.tsx` MUST render a centered `DumbbellSpinner`
- AND MUST NOT render a homepage-shaped skeleton (no header, search, trainer pills, or routine grid)

#### Scenario: Generic root loading is visually distinct from page-shaped skeletons

- GIVEN the root loading is rendered
- WHEN a user sees the loading UI
- THEN it MUST look like the existing `DumbbellSpinner` (the branded app icon spinner)
- AND it MUST NOT cause the user to believe they are loading the homepage specifically

---

## Error State Requirements

### Requirement: Error Handling

The system SHALL handle errors gracefully and display appropriate error messages to users.

#### Scenario: API returns 500 error

- GIVEN the database is unavailable
- WHEN the homepage attempts to fetch routines
- THEN an error message SHALL be displayed to the user
- AND the message SHALL be user-friendly (not a technical stack trace)
- AND MAY include a retry option

#### Scenario: Network failure during navigation

- GIVEN the user has an unstable network connection
- WHEN the page attempts to load data
- THEN an appropriate error state SHALL be displayed
- AND the user SHALL be informed that the data could not be loaded

#### Scenario: Error boundary prevents crash

- GIVEN an unexpected error occurs during rendering
- THEN an error boundary SHALL catch the error
- AND prevent the entire application from crashing
- AND display a recovery message to the user

---

## Design Requirements

### Requirement: Visual Design System

The homepage SHALL follow the defined design system for the gym routines application.

#### Scenario: Consistent typography

- GIVEN components are rendered
- THEN they SHALL use a consistent sans-serif font family
- AND maintain clear typographic hierarchy (headings larger than body text)

#### Scenario: Responsive layout

- GIVEN the homepage is viewed on a mobile device (320px width)
- THEN the layout SHALL adapt to a single-column grid
- AND the SearchBar SHALL span the full width
- AND text SHALL remain readable without horizontal scrolling

#### Scenario: Tablet viewport adaptation

- GIVEN the homepage is viewed on a tablet (768px width)
- THEN the routine cards SHALL display in a 2-column grid
- AND adequate spacing SHALL be maintained

#### Scenario: Desktop viewport optimization

- GIVEN the homepage is viewed on a desktop (1280px width)
- THEN the routine cards SHALL display in a 3-column grid
- AND the content MAY be centered with maximum width constraints

---

## Integration Requirements

### Requirement: End-to-End Flow

The system SHALL support a complete user flow from page load to search interaction.

#### Scenario: Complete user journey

- GIVEN the user opens the application
- AND the database contains routines "Push Day", "Pull Day", "Leg Day"
- WHEN the page loads and displays all routines
- AND the user types "Push" in the search bar
- AND submits the search
- THEN the page SHALL update to show only "Push Day"
- AND the search bar SHALL retain the value "Push"
- AND the URL SHALL reflect `?search=Push`

#### Scenario: Search preserves loading state

- GIVEN the user submits a new search
- WHEN the new data is being fetched
- THEN the loading skeletons SHALL be displayed
- AND previous results MAY remain visible or be replaced with skeletons

#### Scenario: Back navigation with search

- GIVEN the user performed a search and navigated to view details
- WHEN the user clicks the browser back button
- THEN the previous search state SHALL be preserved
- AND the routines SHALL be filtered as they were before navigation

---

## Header Alignment Requirements

### Requirement: Header Vertical Alignment

The flex container containing the SearchBar and navigation buttons in `app/page.tsx` MUST use `items-center` instead of `items-start` for proper vertical centering at the `sm:` responsive breakpoint and above.

This change MUST NOT affect the mobile layout (below `sm:`), where the layout uses `flex-col`.

#### Scenario: Correct vertical alignment on desktop

- GIVEN the user is on the homepage with viewport ≥640px
- WHEN observing the search area and navigation
- THEN the SearchBar and navigation buttons SHALL be vertically aligned to the center

#### Scenario: Mobile layout unchanged

- GIVEN the user is on the homepage with viewport <640px
- WHEN observing the vertical layout (flex-col)
- THEN the behavior SHALL be identical to before (the sm: breakpoint does not apply)

---

## Modern UI Design Requirements

### Requirement: Visual Design System

The homepage SHALL implement a modern, cohesive design system with the following specifications:

#### Scenario: Color Palette - Blue/Gray Theme

- GIVEN the design system is applied
- THEN the application SHALL use a blue and soft gray color palette
- AND primary accent color SHALL be blue-500 (#3b82f6)
- AND neutral tones SHALL use slate-200 through slate-700
- AND all color values SHALL use Tailwind CSS utility classes (not custom hex codes)

#### Scenario: Typography

- GIVEN text elements are rendered
- THEN headings SHALL use `tracking-tight` for sharper, more modern appearance
- AND font weight SHALL be semibold (font-semibold) or bold (font-bold) for emphasis
- AND body text SHALL use `text-muted-foreground` for secondary information

#### Scenario: Card Design

- GIVEN RoutineCard components are displayed
- THEN cards SHALL have gradient backgrounds: `bg-gradient-to-br from-card to-slate-50 dark:to-slate-800/50`
- AND cards SHALL have enhanced shadows on hover: `hover:shadow-xl hover:shadow-blue-500/10`
- AND border color SHALL change to blue on hover: `hover:border-blue-500/50`
- AND transition duration SHALL be 300ms: `transition-all duration-300`
- AND border radius SHALL be consistent: `rounded-xl`

#### Scenario: Search Bar and Controls Alignment

- GIVEN the search bar and action buttons are rendered
- THEN the search input SHALL expand to fill available width: `flex-1 max-w-none`
- AND action buttons SHALL have consistent padding: `py-2.5`
- AND gap between elements SHALL be balanced: `gap-3`
- AND the entire control block SHALL align with the routine cards grid

#### Scenario: Trainer Sidebar

- GIVEN the trainer sidebar is displayed
- THEN the sidebar panel SHALL have rounded corners: `rounded-xl`
- AND subtle shadow: `shadow-sm`
- AND selected state SHALL use blue accent: `bg-blue-500 text-white`
- AND the sidebar top edge SHALL align with the routine cards grid start

#### Scenario: Action Buttons

- GIVEN "Información" and "Feriados" buttons are rendered
- THEN buttons SHALL use slate background: `bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600`
- AND text color SHALL be dark slate: `text-slate-800 dark:text-slate-100`
- AND border radius SHALL be consistent: `rounded-lg`

#### Scenario: Theme Toggle

- GIVEN the theme toggle button is rendered
- THEN icon color SHALL explicitly use foreground: `text-foreground`
- AND hover state SHALL use slate: `hover:bg-slate-200 dark:hover:bg-slate-700`

---

## Page Layout Requirements

### Requirement: Responsive Grid Alignment

The search/controls section SHALL align with the routine cards grid.

#### Scenario: Desktop layout alignment

- GIVEN viewport is ≥1024px (lg breakpoint)
- WHEN observing the search bar, buttons, and routine cards
- THEN all elements SHALL be horizontally aligned to the same left/right boundaries
- AND the search bar SHALL span the same effective width as the cards grid below

#### Scenario: Mobile layout

- GIVEN viewport is <640px
- THEN the layout SHALL stack vertically: `flex-col`
- AND the search bar SHALL be full width
- AND action buttons MAY appear below search or in header

---

## Acceptance Criteria Summary

| Feature | Criterion | Priority |
|---------|-----------|----------|
| API | GET /api/rutinas returns all routines | MUST |
| API | GET /api/rutinas?search= filters by name | MUST |
| API | Error responses return 500 status | MUST |
| RoutineCard | Displays nombre, tipo, descripcion, dias count | MUST |
| RoutineCard | Handles missing description gracefully | MUST |
| RoutineList | Responsive grid (1/2/3 columns) | MUST |
| SearchBar | Updates URL on submit | MUST |
| SearchBar | Handles empty search (clear filter) | MUST |
| Loading | Suspense shows skeleton cards | MUST |
| Loading | Skeletons match card layout | MUST |
| Error | Graceful error handling with user message | MUST |
| Design | Blue/Gray color palette | SHOULD |
| Design | Gradient card backgrounds | SHOULD |
| Design | Hover shadows with blue accent | SHOULD |
| Design | Aligned search bar and cards grid | SHOULD |
| Design | Consistent rounded corners (rounded-xl) | SHOULD |
| Design | Tracking-tight on headings | SHOULD |

---

## Mobile-First Redesign Requirements

### Requirement: Home Page Header — Mobile First

The homepage header SHALL display only the page title and ThemeToggle component on both mobile and desktop viewports. No generic subtitle text SHALL be displayed.

#### Scenario: Header displays title only
**Given** the user is on the home page `/`
**When** the page loads on any viewport size
**Then** the header SHALL display only the page title and the ThemeToggle component
**And** no subtitle text SHALL be displayed

---

### Requirement: RoutineCard — No Author Attribution

The RoutineCard component SHALL NOT display any "Creado por [name]" or author attribution line. Cards SHALL display only: routine title, tipo badge, dias/semanas info, and description.

#### Scenario: Card displays without author
**Given** the user is viewing the home page `/`
**When** routine cards are rendered
**Then** each card SHALL display: routine title, tipo badge, dias/semanas info, and description
**And** each card SHALL NOT display any "Creado por [name]" line or author attribution

---

### Requirement: Mobile Trainer Filter Drawer

The system SHALL provide a Sheet-based bottom drawer for trainer filtering on mobile viewports.

#### Scenario: Mobile "Filtrar" button opens bottom drawer
**Given** the user is on the home page `/` on a mobile viewport (width < 1024px)
**When** the user taps the "Filtrar" button
**Then** a bottom Sheet drawer SHALL open
**And** the drawer SHALL display trainer filter options with selectable pills

#### Scenario: Active filter badge on "Filtrar" button
**Given** a trainer filter is active (via URL search params)
**When** the user views the SearchSection on mobile
**Then** the "Filtrar" button SHALL display a visual badge indicating an active filter

---

### Requirement: Desktop Trainer Pills

The system SHALL display trainer pills on desktop viewports (lg+), replacing the TrainerSidebar paradigm.

#### Scenario: Trainer pills visible on desktop
**Given** the user is on the home page `/` on a desktop viewport (width ≥ 1024px)
**When** the page loads
**Then** trainer pills SHALL be displayed above the routine grid
**And** the pills SHALL be visible without requiring any user interaction

#### Scenario: Trainer pills reflect URL state
**Given** the home page `/` has trainer filter params in the URL
**When** the page loads on desktop
**Then** the trainer pills SHALL show the correct selected state matching the URL params

---

### Requirement: Mobile Bottom Nav Bar

The system SHALL provide a fixed bottom bar on mobile viewports containing Info and Feriados navigation.

#### Scenario: Bottom bar appears on mobile
**Given** the user is on the home page `/` on a mobile viewport (width < 1024px)
**When** the page loads
**Then** a fixed bottom bar SHALL be visible at the bottom of the viewport
**And** the bottom bar SHALL display Info icon with "Información" label and Feriados icon with "Feriados" label

#### Scenario: Bottom bar hidden on desktop
**Given** the user is on the home page `/` on a desktop viewport (width ≥ 1024px)
**When** the page loads
**Then** the fixed bottom bar SHALL NOT be rendered or displayed

---

### Requirement: Desktop Info/Feriados Header Links

The system SHALL display discrete icon-only links for Info and Feriados in the header area on desktop viewports.

#### Scenario: Header shows icon links on desktop
**Given** the user is on the home page `/` on a desktop viewport (width ≥ 1024px)
**When** the page loads
**Then** the header SHALL display discrete icon-only links for Info and Feriados

#### Scenario: Header links hidden on mobile
**Given** the user is on the home page `/` on a mobile viewport
**When** the page loads
**Then** the Info/Feriados header links SHALL NOT be rendered or displayed

---

### Requirement: Mobile Layout Order

The mobile layout SHALL follow a specific visual order with proper bottom padding to prevent overlap with the fixed bottom bar.

#### Scenario: Correct mobile layout order
**Given** the user is on the home page `/` on a mobile viewport
**When** the page renders
**Then** the visual order from top to bottom SHALL be: Header, SearchSection (with trainer filter button), RoutineCard grid, Bottom Bar

#### Scenario: Content does not overlap bottom bar
**Given** the user is on the home page `/` on a mobile viewport
**When** the page renders
**Then** the routine card grid SHALL have bottom padding of at least `pb-16` (or equivalent) to prevent overlap with the fixed bottom bar

---

### Requirement: Theme Consistency — CSS Var Tokens

All components affected by the mobile-first redesign SHALL use CSS custom property tokens for all colors and SHALL NOT contain hardcoded `slate-*` color values.

#### Scenario: No hardcoded slate colors
**Given** the following files are modified as part of this change:
- `src/app/(public)/page.tsx`
- `src/components/routines/routine-card.tsx`
- `src/components/search/trainer-pills.tsx`
- `src/components/search/search-section.tsx`
- `src/components/search/trainer-filter-drawer.tsx`
- `src/components/layout/bottom-bar.tsx`

**When** these files are reviewed or rendered
**Then** NO hardcoded `slate-*` color values SHALL be present
**And** all colors SHALL use CSS var tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `hover:bg-accent`, `focus:ring-ring`)

---

## Acceptance Criteria Summary (Mobile-First Redesign)

| Feature | Criterion | Priority |
|---------|-----------|----------|
| Header | Shows only title + ThemeToggle (no subtitle) | MUST |
| RoutineCard | Does NOT display "Creado por [name]" | MUST |
| Mobile Drawer | "Filtrar" button opens Sheet-based bottom drawer | MUST |
| Trainer Filter | Pill selection updates URL params | MUST |
| Filter Badge | Active badge shows on "Filtrar" when filter active | MUST |
| Desktop Pills | Trainer pills visible (lg+), not sidebar | MUST |
| Mobile Bottom Bar | Shows Info + Feriados with icons and labels | MUST |
| Desktop Header | Shows Info + Feriados icon-only links | MUST |
| Responsive | Bottom bar hidden on desktop, header links hidden on mobile | MUST |
| Layout | Mobile order: header → search → filter → cards → bottom bar | MUST |
| Padding | Card grid has `pb-16` bottom padding on mobile | MUST |
| Theme | CSS var tokens used, no hardcoded slate-* | MUST |
| Light Mode | All components render correctly | MUST |
| Dark Mode | All components render correctly | MUST |

---

## Technical Implementation Notes (Not Part of Spec)

The following are implementation guidance and are NOT requirements:

- Server Components fetch data directly without useEffect
- use() hook consumes async promises in components
- Tailwind CSS classes for styling
- URL searchParams used for search state
- next/navigation for client-side navigation
