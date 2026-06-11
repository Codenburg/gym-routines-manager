# Delta for Design System

## ADDED Requirements

### Requirement: Skeleton UI Primitive

The system SHALL provide a `Skeleton` component as part of the UI primitives library. The component MUST render a non-interactive placeholder block that uses the design system's `bg-muted` token and `animate-pulse` animation, with `rounded` corners. The component MUST be a thin wrapper that accepts sizing variants (e.g. `h-{n}` and `w-{n}` Tailwind utility classes) via a className passthrough. The component MUST NOT render any text, image, or interactive content.

#### Scenario: Skeleton renders a muted, animated placeholder

- GIVEN a developer renders `<Skeleton className="h-4 w-32" />`
- WHEN the component mounts
- THEN the rendered element MUST be a `<div>` with `bg-muted`, `animate-pulse`, and `rounded` classes applied
- AND the dimensions MUST match the supplied `h-4 w-32` utilities

#### Scenario: Skeleton is non-interactive

- GIVEN a Skeleton element is rendered
- WHEN a user attempts to focus, click, or select it
- THEN the element MUST NOT be focusable, clickable, or selectable (no handlers, no role)
- AND the element MUST NOT contain text or images

#### Scenario: Skeleton accepts arbitrary className for sizing variants

- GIVEN a developer renders `<Skeleton className="h-12 w-full" />`
- WHEN the component mounts
- THEN the rendered element MUST apply both the default `bg-muted animate-pulse rounded` classes AND the supplied `h-12 w-full` classes
- AND the className utilities MUST be merged (later classes win on conflict)

### Requirement: Page Loading Conventions

The system SHALL define three distinct mechanisms for showing loading UI, and developers MUST use the correct one based on the scope of the loading state.

| Mechanism | File convention | When to use |
|-----------|----------------|-------------|
| `loading.tsx` | Co-located `loading.tsx` file at a route group level | Route group level (e.g. `(public)/loading.tsx`, `(admin)/loading.tsx`) — shows a page-shaped skeleton while the segment's server components resolve |
| `<Suspense>` boundary | In-page `<Suspense fallback={...}>` wrapping a streaming subtree | In-page streaming — a subtree of the page is slow and the page shell must render first |
| `DumbbellSpinner` | Existing in-button spinner primitive | In-button pending state driven by `useActionState`'s `isPending` flag |

#### Scenario: Route group loading file scope

- GIVEN a route group `(public)` has a co-located `loading.tsx` file
- WHEN any page under `(public)/**` is in flight
- THEN Next.js MUST render the `(public)/loading.tsx` component as the immediate UI while the page's data is being resolved
- AND the loading component MUST match the visual structure of the destination page (e.g. homepage shape for the home route)

#### Scenario: In-page Suspense boundary scope

- GIVEN a page contains a `<Suspense fallback={<SkeletonList/>}>` wrapping a slow Server Component subtree
- WHEN the page is requested
- THEN the rest of the page (outside the boundary) MUST render immediately
- AND the fallback MUST render in place of the slow subtree until it resolves

#### Scenario: In-button spinner scope

- GIVEN a form button is bound to a `useActionState` action
- WHEN the action is in flight
- THEN the button MUST render the existing `DumbbellSpinner` in place of its label
- AND the button MUST be `disabled` while pending

#### Scenario: Generic root loading fallback

- GIVEN a route does NOT have a co-located `loading.tsx` file (e.g. 404 boundary, very deep segment)
- WHEN Next.js needs a loading UI
- THEN the root `src/app/loading.tsx` MUST render a generic branded `DumbbellSpinner` (NOT a page-shaped skeleton)
- AND this generic fallback MUST apply to any route group that hasn't defined its own `loading.tsx`

### Requirement: Skeleton Composition

Page-shaped loading states MUST be composed by combining small `<Skeleton>` primitives rather than hand-rolled placeholder divs. The convention is: build a page-shaped skeleton component by stacking multiple `<Skeleton>` elements in the same layout as the real page's content sections.

#### Scenario: Dashboard loading state uses composed Skeletons

- GIVEN the admin dashboard's `loading.tsx` file is being authored
- WHEN the developer composes the loading UI
- THEN the loading UI MUST use `<Skeleton>` primitives for each block (title bar, 3 stat cards, 6 routine cards)
- AND the layout MUST match the real dashboard's spatial structure (3-column stat row, 2-3 column routine grid)
- AND the developer MUST NOT use raw `<div className="bg-muted animate-pulse">` markup

#### Scenario: Feriados list loading state reuses an extracted component

- GIVEN the public feriados page has a `loading.tsx` file
- WHEN the loading file is authored
- THEN the developer MUST extract the inline feriado-row skeleton into `src/components/feriados/feriados-skeleton.tsx` (a shared component)
- AND the loading file MUST import that shared component rather than re-implementing the skeleton

#### Scenario: Form loading state reuses an extracted component

- GIVEN the admin rutinas form (new + edit) has a `loading.tsx` file
- WHEN the loading file is authored
- THEN the developer MUST extract the inline form-field skeleton into `src/components/admin/rutinas/rutinas-form-skeleton.tsx`
- AND both the new-routine `loading.tsx` and the edit-routine `loading.tsx` MUST import that shared component
