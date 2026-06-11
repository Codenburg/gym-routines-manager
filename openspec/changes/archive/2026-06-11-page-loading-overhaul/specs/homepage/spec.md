# Delta for Homepage

## MODIFIED Requirements

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

## ADDED Requirements

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
