# Delta for Admin Panel

## ADDED Requirements

### Requirement: Admin Config Page Navigation

The admin sidebar MUST expose a "Configuración" (or equivalently named) nav item that links to `/admin/config`. The item MUST follow the existing visual conventions of other admin sidebar items and MUST be visible to all admin roles that have access to the gym configuration feature.
(Previously: The admin sidebar did not include a link to the gym config page.)

#### Scenario: Admin sees Configuración nav item

- GIVEN an authenticated admin with role ADMIN
- WHEN the admin sidebar renders
- THEN a nav item linking to `/admin/config` MUST be visible
- AND the label MUST reflect gym configuration intent (e.g., "Configuración" or "Gym")

#### Scenario: Clicking the nav item navigates to the config page

- GIVEN an authenticated admin clicks the config nav item in the sidebar
- WHEN the navigation completes
- THEN the user MUST be on the `/admin/config` page
- AND the sidebar item MUST reflect the active route

### Requirement: Admin Config Form Layout

The `/admin/config` page MUST render a form organized into logical field groups, matching the existing `FormState<T>` + `useActionState` pattern used by `GymPriceEditor`. Each group MUST be independently submittable so an admin can save one section without re-validating the others.
(Previously: No `/admin/config` page existed.)

#### Scenario: Config page renders all field groups

- GIVEN an authenticated admin visits `/admin/config`
- WHEN the page renders
- THEN a form MUST display input fields grouped as: Identity (nombre), Hours & Address (horario, direccion, mapsEmbedUrl), Social (socialInstagram, socialWhatsapp)
- AND each group MUST have its own "Guardar" button

#### Scenario: Inputs sync with server state

- GIVEN the Gym record is updated by another admin while the form is open
- WHEN the page re-fetches (e.g., after a save in another tab)
- THEN the input fields MUST re-sync with the latest server values
- AND the implementation MUST follow the controlled-or-key-resync rule from `react_rules.server_action_inputs` in `openspec/config.yaml`

#### Scenario: Validation errors display inline

- GIVEN an admin submits a group with invalid input (e.g., empty nombre, malformed URL)
- WHEN the server action returns a `FormState` with `errors`
- THEN the error message MUST be rendered near the offending input
- AND the form MUST remain in edit mode (not collapse or close)

#### Scenario: Success toast on save

- GIVEN an admin submits a group with valid input
- WHEN the server action returns `{ success: true }`
- THEN a success toast MUST be displayed (e.g., "Configuración actualizada")
- AND the page MUST reflect the new persisted values

### Requirement: Config Page Auth Integration

The `/admin/config` page MUST be protected by the same auth middleware that guards the rest of the admin panel. Unauthenticated users MUST be redirected to `/admin/login`. Non-admin users (role USER) MUST be redirected to the homepage. Trainer users (role TRAINER) MUST be redirected to `/admin/rutinas` per the existing RBAC rules.

#### Scenario: Unauthenticated redirect

- GIVEN no session exists
- WHEN a request to `/admin/config` is made
- THEN the user MUST be redirected to `/admin/login`

#### Scenario: Regular user blocked

- GIVEN a user with role USER is authenticated
- WHEN the user navigates to `/admin/config`
- THEN the user MUST be redirected to the homepage
