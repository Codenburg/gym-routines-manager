# Delta for Ejercicio Metadata

## Purpose

This spec defines the metadata fields for exercises, specifically series and repetitions (but not weights).

## ADDED Requirements

### Requirement: Ejercicio Has Series and Repes Fields

The Ejercicio model MUST store optional metadata for series and repetitions.

- GIVEN an ejercicio exists in the database
- WHEN retrieving the ejercicio
- THEN the response SHALL include optional `series` and `repes` fields
- AND these fields SHALL be nullable (optional)

#### Scenario: Exercise with series and reps

- GIVEN an ejercicio has series = "3" and repes = "12"
- WHEN the API returns the ejercicio
- THEN the response SHALL include `series`: "3" and `repes`: "12"
- AND the UI SHALL display "3x12"

#### Scenario: Exercise with multiple sets notation

- GIVEN an ejercicio has series = "3x12 - 1x10"
- WHEN the UI displays the exercise
- THEN it SHALL show "3x12 - 1x10" as-is
- (The format is flexible - could be "4x10", "3x12 - 1x10", etc.)

#### Scenario: Exercise without metadata

- GIVEN an ejercicio has no series/repes (null)
- WHEN the UI displays the exercise
- THEN it SHALL NOT show any series/repes information
- AND the field SHALL be omitted from the API response (or be null)

### Requirement: API Response Includes Metadata

The API endpoints that return ejercicios MUST include the new fields.

#### Scenario: GET /api/rutinas/[id] includes metadata

- GIVEN a rutina exists with dias and ejercicios
- WHEN the client calls GET /api/rutinas/[id]
- THEN each ejercicio SHALL include `series` and `repes` fields

#### Scenario: GET /api/rutinas/[id]/dias/[diaId] includes metadata

- GIVEN a dia exists with ejercicios
- WHEN the client calls GET /api/rutinas/[id]/dias/[diaId]
- THEN each ejercicio SHALL include `series` and `repes` fields

### Requirement: UI Displays Series x Repes

The UI MUST display the series and repetitions in a readable format.

#### Scenario: Display format "NxN"

- GIVEN an ejercicio has series = "3" and repes = "12"
- WHEN the UI renders the exercise card
- THEN it SHALL display "3x12" (series x repes)

#### Scenario: Display format "NxN - NxN" for multiple sets

- GIVEN an ejercicio has series = "3x12 - 1x10"
- WHEN the UI renders the exercise card
- THEN it SHALL display "3x12 - 1x10"

#### Scenario: No metadata to display

- GIVEN an ejercicio has no series/repes (null)
- WHEN the UI renders the exercise card
- THEN it SHALL NOT display any series/repes text

## MODIFIED Requirements

### Requirement: Seed Data Includes Metadata

The seed script SHALL populate ejercicios with series and repes values.

(Previously: No metadata was seeded. Now: Seed includes realistic values like "3x12", "4x10", "3x12 - 1x10")

## Edge Cases

### Scenario: Empty string vs null

- GIVEN series = "" (empty string)
- THEN the UI SHALL treat it as no metadata (don't display)

### Scenario: Invalid format

- GIVEN series has unexpected format (e.g., "abc")
- THEN the UI SHALL display it as-is (no validation)
