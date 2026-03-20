# Delta for UI

## Purpose

This spec defines the frontend requirements for displaying and editing the gym price configuration in the admin interface.

## ADDED Requirements

### Requirement: Display Current Price

The system MUST display the current gym price fetched from the API in the admin interface.

#### Scenario: Display price from API

- GIVEN The admin page loads
- WHEN The component fetches from GET /api/gym
- THEN The current price MUST be displayed in a readable format (e.g., "$45.000")

#### Scenario: Loading state

- GIVEN The admin page is loading
- WHEN The API request is in flight
- THEN A loading skeleton or spinner MUST be displayed

#### Scenario: API error handling

- GIVEN The API is unavailable or returns an error
- WHEN The component attempts to fetch the price
- THEN An error message MUST be displayed to the user
- AND The user SHOULD be able to retry

### Requirement: Edit Price Functionality

The system MUST provide a mechanism for admin users to edit the gym price.

#### Scenario: Enter edit mode

- GIVEN The admin user is viewing the price display
- WHEN The user clicks the "Editar precio" button
- THEN The display MUST change to a numeric input field
- AND The current price MUST be pre-filled in the input

#### Scenario: Cancel edit

- GIVEN The user is in edit mode with unsaved changes
- WHEN The user clicks a cancel button
- THEN The input MUST be discarded
- AND The original price MUST be displayed again

#### Scenario: Save new price

- GIVEN The user is in edit mode with a valid new price
- WHEN The user clicks "Guardar"
- THEN The PATCH /api/gym request MUST be sent with the new price
- AND On success, the display MUST update with the new price
- AND The component MUST exit edit mode

#### Scenario: Save with invalid input

- GIVEN The user is in edit mode with invalid input (negative, zero, non-numeric)
- WHEN The user clicks "Guardar"
- THEN A validation error message MUST be displayed
- AND The request MUST NOT be sent to the API

### Requirement: Price Formatting

The system MUST display prices in a user-friendly format following Argentine conventions.

#### Scenario: Display formatted price

- GIVEN The price value is 45000
- WHEN The price is rendered for display
- THEN It MUST be displayed as "$45.000" ( peso sign, thousand separator)

#### Scenario: Input accepts numeric values

- GIVEN The user is editing the price
- WHEN The user types in the input field
- THEN Only numeric characters MUST be accepted

### Requirement: Remove Hardcoded Price

The system MUST remove all hardcoded price constants from the codebase.

#### Scenario: Informacion page uses API

- GIVEN The informacion page loads
- WHEN The page renders the price section
- THEN The price MUST be fetched from GET /api/gym
- AND There MUST NOT be any hardcoded "$45.000" in the source

#### Scenario: Search for remaining hardcoded prices

- GIVEN The refactoring is complete
- WHEN A grep search is performed for "45.000" or "$45000"
- THEN No matches SHOULD be found in source files (except tests if applicable)

## Component Specification

### Admin Price Editor Component

**Location**: `src/components/admin/` (new file)

**States**:
- `loading`: Display skeleton/spinner while fetching
- `display`: Show current price with edit button
- `editing`: Show input field with save/cancel buttons
- `saving`: Show loading state while PATCH request is in flight
- `error`: Show error message with retry option

**Props** (if exposed):
- None required (fetches its own data)

**Internal Data**:
- `price`: number | null
- `isEditing`: boolean
- `inputValue`: string
- `isLoading`: boolean
- `isSaving`: boolean
- `error`: string | null

### Informacion Page Modification

**Location**: `src/app/informacion/page.tsx`

**Changes**:
- Remove hardcoded `$45.000` from line 54
- Add data fetching from GET /api/gym
- Display price from API response

## Acceptance Criteria

- [ ] Admin component fetches price from GET /api/gym on mount
- [ ] Admin component displays formatted price (e.g., "$45.000")
- [ ] "Editar precio" button activates edit mode
- [ ] Numeric input accepts only valid numbers
- [ ] Save button sends PATCH request with new price
- [ ] Refetch occurs after successful save
- [ ] Error states are handled gracefully
- [ ] Loading states are displayed appropriately
- [ ] informacion/page.tsx no longer contains hardcoded "$45.000"
- [ ] No other hardcoded price constants exist in the codebase
