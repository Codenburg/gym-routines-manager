# Delta for Search & Filtering

## Purpose

This delta spec describes changes to the search and filtering functionality, replacing the unified autocomplete approach with a separated search input and trainer sidebar filter panel.

## ADDED Requirements

### Requirement: Trainer Sidebar Filter Panel

The system MUST display a sidebar panel containing a scrollable list of trainer names as filter options.

The sidebar MUST:
- Display each unique trainer name from the database
- Show a count of routines per trainer next to each name
- Provide checkboxes for multiple trainer selection
- Include an "Todos" option to clear all trainer filters

#### Scenario: Display trainer list in sidebar

- GIVEN there are trainers with routines in the database
- WHEN the user visits the routines page
- THEN the sidebar displays a list of trainers with checkboxes
- AND each trainer shows their routine count in parentheses

#### Scenario: Select single trainer filter

- GIVEN the trainer sidebar is visible
- WHEN the user checks a trainer checkbox
- THEN the results filter to show only routines from that trainer
- AND an active filter chip appears above the results

#### Scenario: Select multiple trainers

- GIVEN the trainer sidebar is visible
- WHEN the user checks multiple trainer checkboxes
- THEN the results filter to show routines from ANY selected trainer
- AND each selected trainer appears as a chip above results

#### Scenario: Deselect all trainers (Todos)

- GIVEN one or more trainers are selected
- WHEN the user clicks "Todos" option
- THEN all checkboxes are cleared
- AND the results show routines from all trainers

### Requirement: Simplified Search Input

The search input MUST only filter routines by name (`routine.nombre`).

The input MUST:
- Display centered in the main content area
- Apply a 300ms debounce before triggering the search
- Filter results using `ILIKE` pattern matching on `routine.nombre`

#### Scenario: Search by routine name

- GIVEN the search input is empty
- WHEN the user types "pierna" in the search input
- THEN after 300ms the results filter to show only routines containing "pierna" in the name

#### Scenario: Clear search input

- GIVEN the search input has text and results are filtered
- WHEN the user clicks the clear button (X)
- THEN the input clears
- AND all routines are displayed (respecting any trainer filters)

### Requirement: Active Filter Chips

The system MUST display chips above the results showing active filters.

Each chip MUST:
- Display the filter label (e.g., "Entrenador: Juan")
- Be removable by clicking an X button
- Allow clearing all filters with a "Limpiar todo" option

#### Scenario: Display active trainer filter chip

- GIVEN a trainer checkbox is selected
- WHEN the results update
- THEN a chip appears showing "Entrenador: {name}"
- AND clicking the X removes that filter

### Requirement: API Endpoint for Trainer List

The system MUST provide an API endpoint to fetch trainers with routine counts.

#### Scenario: Fetch trainer list with counts

- GIVEN the system has routines with creators
- WHEN a GET request is made to `/api/trainers`
- THEN the response returns an array of objects with:
  - `nombre`: trainer name
  - `count`: number of routines by that trainer

## MODIFIED Requirements

### Requirement: GET /api/rutinas Query Parameters

The existing `/api/rutinas` endpoint MUST accept a new parameter for trainer filtering.

The endpoint MUST:
- Accept `trainers` parameter as comma-separated string of trainer names
- Filter results to include routines where `creador` matches ANY of the specified trainers
- Maintain backward compatibility (empty `trainers` returns all routines)

#### Scenario: Filter by single trainer

- GIVEN there are routines from multiple trainers
- WHEN a request is made to `/api/rutinas?trainers=Juan`
- THEN only routines where `creador = 'Juan'` are returned

#### Scenario: Filter by multiple trainers

- GIVEN there are routines from multiple trainers
- WHEN a request is made to `/api/rutinas?trainers=Juan,Maria`
- THEN routines where `creador = 'Juan'` OR `creador = 'Maria'` are returned

#### Scenario: Combined search and trainer filter

- GIVEN there are routines with various names and trainers
- WHEN a request is made to `/api/rutinas?search=full&trainers=Juan`
- THEN routines matching BOTH conditions are returned

## REMOVED Requirements

### Requirement: Search Autocomplete

The autocomplete dropdown showing both routines and trainers during typing MUST be removed.

(Reason: Replaced by separated search input and sidebar panel approach)

#### Scenario: Autocomplete no longer appears

- GIVEN the user is typing in the search input
- WHEN the user types any text
- THEN no autocomplete dropdown appears
- AND results only filter after debounce completes

### Requirement: Type Selector

The type selector dropdown that filters routines by type MUST be removed.

(Reason: Simplifying the UI to focus on name search and trainer filters only)
