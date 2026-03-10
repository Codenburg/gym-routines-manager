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

The system SHALL implement loading states using Next.js Suspense and a custom loading component.

The loading state MUST display skeleton cards that match the visual structure of the actual RoutineCards.

#### Scenario: Display loading skeletons

- GIVEN the user navigates to the homepage
- WHEN the routines data is being fetched
- THEN skeleton placeholders SHALL be displayed
- AND the skeletons SHALL mimic the RoutineCard layout
- AND multiple skeleton cards (e.g., 3-6) SHALL be shown to indicate loading

#### Scenario: Loading state transitions to content

- GIVEN the user navigates to the homepage and skeletons are displayed
- WHEN the routine data finishes loading
- THEN the skeletons SHALL be replaced with actual RoutineCard components
- AND the transition SHALL be smooth without layout shift

#### Scenario: Loading component structure

- GIVEN the loading.tsx file exists
- WHEN it is rendered by Next.js
- THEN it SHALL export a default component
- AND the component SHALL use the same grid layout as the RoutineList
- AND the skeleton cards SHALL have the same dimensions as actual cards

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
| Design | Mobile-first responsive layout | SHOULD |
| Design | Consistent typography and spacing | SHOULD |

---

## Technical Implementation Notes (Not Part of Spec)

The following are implementation guidance and are NOT requirements:

- Server Components fetch data directly without useEffect
- use() hook consumes async promises in components
- Tailwind CSS classes for styling
- URL searchParams used for search state
- next/navigation for client-side navigation
