# Delta for Search UI

## ADDED Requirements

### Requirement: Search type selector

The search bar component MUST include a dropdown selector to choose the search type (nombre vs creador).

The system SHALL display a Select component (shadcn/ui) adjacent to the search input.

#### Scenario: User selects "Buscar por creador"

- GIVEN the user is on the homepage with the search bar visible
- WHEN the user selects "Creador" from the dropdown
- AND types "Marcelo" in the search input
- THEN the application MUST navigate to ?search=Marcelo&searchBy=creador
- AND the results MUST filter routines by creator name

#### Scenario: User selects "Buscar por nombre"

- GIVEN the user is on the homepage with the search bar visible
- WHEN the user selects "Nombre" from the dropdown
- AND types "Pecho" in the search input
- THEN the application MUST navigate to ?search=Pecho&searchBy=nombre
- AND the results MUST filter routines by nombre

#### Scenario: Default search type is "Nombre"

- GIVEN the user loads the homepage for the first time
- THEN the search dropdown MUST display "Nombre" as the default selected option
- AND searching without explicitly selecting a type MUST behave as searching by nombre

#### Scenario: Search type persists in URL

- GIVEN the user has selected "Creador" and searched for "Juan"
- WHEN the page reloads
- THEN the URL MUST contain searchBy=creador
- AND the dropdown MUST display "Creador" as selected
- AND the input MUST contain "Juan"
