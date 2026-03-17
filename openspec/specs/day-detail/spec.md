# Delta for Day Detail

## Purpose

This spec defines the behavior for viewing exercise details within a training day. It enables users to navigate from the routine detail page to see exercises for each specific day.

## ADDED Requirements

### Requirement: Day Cards Must Be Navigable

The routine detail page SHALL display each training day as a clickable card that navigates to the day detail page.

- GIVEN a user is on the routine detail page (`/rutinas/[id]`)
- WHEN the user clicks on a day card
- THEN the user SHALL be navigated to `/rutinas/[id]/dias/[diaId]`
- AND the day detail page SHALL display the day's name, muscle groups, and exercise list

#### Scenario: Click on day card navigates to day detail

- GIVEN a routine exists with at least one day
- AND the user is viewing the routine detail page
- WHEN the user clicks on a day card
- THEN the browser URL SHALL change to `/rutinas/{rutinaId}/dias/{diaId}`
- AND the day detail page SHALL load with the correct day information

#### Scenario: Back navigation returns to routine detail

- GIVEN a user is viewing a day detail page
- WHEN the user clicks the "back" button
- THEN the user SHALL be navigated back to `/rutinas/[id]`
- AND the previous routine context SHALL be preserved

### Requirement: Day Detail API Endpoint

The system MUST provide an API endpoint to fetch a single day with its exercises.

#### Scenario: GET returns day with exercises

- GIVEN a day exists with exercises in the database
- WHEN the client sends `GET /api/rutinas/[id]/dias/[diaId]`
- THEN the response SHALL have status 200
- AND the response body SHALL contain:
  - `id`: string (day ID)
  - `nombre`: string (day name)
  - `musculosEnfocados`: string | null
  - `orden`: number
  - `ejercicios`: array of objects with `id`, `nombre`, `orden`

#### Scenario: GET returns 404 for non-existent day

- GIVEN no day exists with the provided ID
- WHEN the client sends `GET /api/rutinas/[id]/dias/[nonExistentId]`
- THEN the response SHALL have status 404
- AND the response body SHALL contain `error`: "Day not found"

#### Scenario: GET handles server errors gracefully

- GIVEN the database is unavailable
- WHEN the client sends `GET /api/rutinas/[id]/dias/[diaId]`
- THEN the response SHALL have status 500
- AND the response body SHALL contain a generic error message

### Requirement: Day Detail Page Displays Exercise List

The day detail page MUST display all exercises for the selected day in a clear, ordered list.

#### Scenario: Day with exercises displays correctly

- GIVEN a day has at least one exercise
- WHEN the day detail page loads
- THEN the page SHALL display the day name as heading
- AND SHALL display the muscle groups (if set)
- AND SHALL display all exercises ordered by `orden` field
- AND each exercise SHALL show its position number and name

#### Scenario: Day without exercises shows empty state

- GIVEN a day has no exercises
- WHEN the day detail page loads
- THEN the page SHALL display the day name
- AND SHALL display "No hay ejercicios configurados para este día"

#### Scenario: Routine info displayed on day page

- GIVEN a user is viewing a day detail page
- THEN the page SHALL display a link back to the parent routine
- AND SHALL display the routine name (optional, for context)

### Requirement: Seed Data Includes Exercises

The seed script SHALL populate the database with example exercises for demonstration purposes.

#### Scenario: Seed creates exercises for each day

- GIVEN the seed script is executed
- THEN each training day SHALL have at least 2-4 exercises
- AND exercises SHALL be ordered sequentially (orden: 1, 2, 3...)
- AND exercise names SHALL be realistic gym exercises

## MODIFIED Requirements

### Requirement: Routine Detail Page Day Cards

The existing routine detail page SHALL be modified to make day cards navigable.

(Previously: Day cards displayed exercise names inline; Now: Day cards are clickable links to day detail page)

#### Scenario: Day cards show exercise count summary

- GIVEN a day has exercises
- WHEN displaying the day card on routine detail page
- THEN the card SHALL show "X ejercicios" as a summary
- AND the card SHALL be clickable to navigate to day detail

## REMOVED Requirements

### Requirement: (None)

No requirements are being removed by this change.

## Edge Cases

### Scenario: Invalid day ID format

- GIVEN the user navigates to `/rutinas/[id]/dias/invalid-uuid`
- THEN the system SHALL return 404 or handle gracefully

### Scenario: Day belongs to different routine

- GIVEN the user tries to access a day ID that belongs to a different routine
- THEN the system SHALL return 404 (day not found for this routine context)
- OR the system SHALL verify the routine ID matches

### Scenario: Empty muscle groups

- GIVEN a day has no `musculosEnfocados` set
- THEN the page SHALL NOT display the muscle groups section
- AND SHALL NOT show null/undefined values

---

## UI Design Requirements

### Requirement: Modern Visual Design

The day detail page SHALL follow the same modern design system as the homepage.

#### Scenario: Color Palette Consistency

- GIVEN the day detail page is rendered
- THEN it SHALL use the same blue accent color as other pages: `blue-500`
- AND use the same slate-based neutral palette
- AND use Tailwind CSS utility classes (not custom hex codes)

#### Scenario: Card Styling for Days

- GIVEN day cards are displayed on the routine detail page
- THEN cards SHALL have gradient backgrounds: `bg-gradient-to-br from-card to-slate-50 dark:to-slate-800/50`
- AND enhanced hover shadows: `hover:shadow-xl hover:shadow-blue-500/10`
- AND border color change on hover: `hover:border-blue-500/50`
- AND transition duration: `transition-all duration-300`
- AND rounded corners: `rounded-xl`

#### Scenario: Exercise Cards Styling

- GIVEN exercise cards are displayed on the day detail page
- THEN each exercise SHALL be in a card with gradient background
- AND have hover shadow effect: `hover:shadow-lg hover:shadow-blue-500/10`
- AND use blue accent for exercise number badges: `bg-blue-500/20 text-blue-500`
- AND have rounded corners: `rounded-xl`

#### Scenario: Navigation Elements

- GIVEN back navigation buttons are rendered
- THEN they SHALL use blue color: `text-blue-500 hover:text-blue-400`
- AND have font-medium weight: `font-medium`
- AND include smooth transitions: `transition-colors`

#### Scenario: Badges and Labels

- GIVEN type badges and muscle group tags are displayed
- THEN they SHALL use blue background: `bg-blue-500/20`
- AND blue text: `text-blue-500`
- AND rounded-full shape: `rounded-full`
- AND consistent padding: `px-3 py-1`

#### Scenario: Typography Consistency

- GIVEN all text elements are rendered
- THEN headings SHALL use `tracking-tight`
- AND titles SHALL use `font-semibold`
- AND secondary text SHALL use `text-muted-foreground`

---

## Acceptance Criteria

| Feature | Criterion | Priority |
|---------|-----------|----------|
| Navigation | Day cards are clickable links | MUST |
| Navigation | Back button returns to routine | MUST |
| API | GET day with exercises returns 200 | MUST |
| API | GET non-existent day returns 404 | MUST |
| Display | Day name as heading | MUST |
| Display | Muscle groups (if set) | MUST |
| Display | Exercises ordered by orden | MUST |
| Empty State | Message when no exercises | MUST |
| Design | Blue accent color | SHOULD |
| Design | Gradient card backgrounds | SHOULD |
| Design | Hover shadow effects | SHOULD |
| Design | Consistent rounded corners | SHOULD |
