# Delta for Search API

## MODIFIED Requirements

### Requirement: GET /api/rutinas search filter

The endpoint GET /api/rutinas MUST support filtering by `creador` field in addition to `nombre`.

The system MUST accept an optional query parameter `searchBy` with values `nombre` (default) or `creador`.

#### Scenario: Search by creator name

- GIVEN there are routines in the database with creator "Marcelo"
- WHEN client sends GET /api/rutinas?search=Marcelo&searchBy=creador
- THEN the response MUST return only routines where `creador` contains "Marcelo" (case-insensitive)
- AND routines where `nombre` contains "Marcelo" MUST NOT be included

#### Scenario: Search by routine name (backward compatible)

- GIVEN there are routines with "Pecho" in the nombre field
- WHEN client sends GET /api/rutinas?search=Pecho
- THEN the response MUST return only routines where `nombre` contains "Pecho" (case-insensitive)
- AND this behavior MUST be identical to the existing implementation (backward compatible)

#### Scenario: Search by routine name with explicit searchBy

- GIVEN there are routines with "Piernas" in the nombre field
- WHEN client sends GET /api/rutinas?search=Piernas&searchBy=nombre
- THEN the response MUST return only routines where `nombre` contains "Piernas"

#### Scenario: Empty search returns all routines

- GIVEN there are routines in the database
- WHEN client sends GET /api/rutinas (without search parameter)
- THEN the response MUST return all routines
- AND this behavior MUST remain unchanged

#### Scenario: Search with no results

- GIVEN there are no routines where creator contains "Nobody"
- WHEN client sends GET /api/rutinas?search=Nobody&searchBy=creador
- THEN the response MUST return an empty array

#### Scenario: Invalid searchBy parameter is ignored

- GIVEN client sends GET /api/rutinas?search=Test&searchBy=invalid
- THEN the system MUST default to searching by `nombre`
- AND the response MUST behave as if searchBy was not provided
