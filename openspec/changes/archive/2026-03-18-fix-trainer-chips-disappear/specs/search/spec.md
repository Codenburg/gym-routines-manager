# Delta Spec: Fix Trainer Chips Disappearing Bug

## Domain: search

## ADDED Requirements

### Requirement: Stable Trainer List for Chip Display

The trainer sidebar chips MUST always display all trainers from the complete dataset, regardless of the current filter state.

The implementation MUST:
- Derive trainer list from ALL rutinas (unfiltered) before applying any trainer filter
- Use two separate database queries: one for trainers (unfiltered), one for rutinas (filtered)
- Never filter the trainer list based on the active filter state
- Maintain stable counts based on total routines per trainer

#### Scenario: Chips remain visible when filter is active

- GIVEN multiple trainers exist in the database (e.g., "Nando", "Maxi", "Santi")
- WHEN the user selects "Nando" filter
- THEN all chips (Nando, Maxi, Santi) remain visible
- AND only routines from "Nando" are displayed

#### Scenario: Multiple trainer selection

- GIVEN multiple trainers exist
- WHEN the user selects "Nando" and "Maxi"
- THEN all chips remain visible
- AND routines from both "Nando" and "Maxi" are displayed

#### Scenario: Toggle trainer filter off

- GIVEN "Nando" is selected and other chips are visible
- WHEN the user clicks "Nando" again to deselect
- THEN all chips remain visible
- AND all routines are displayed

## MODIFIED Requirements

### Requirement: Trainer Sidebar as Source of Truth (Updated)

**Previous behavior**: Trainer list derived from filtered routines, causing chips to disappear.

**New behavior**: Trainer list derived from unfiltered routines, ensuring all chips always visible.

The trainer sidebar MUST:
- Display each unique trainer name from the database (unfiltered count)
- Show the TOTAL count of routines per trainer (not filtered count)
- Provide checkboxes for multiple trainer selection
- Include "Todos" option to clear all trainer filters
- Visually indicate selected trainers

### Requirement: Filtered Routines Display (Clarification)

The filtered routines display MUST derive from the filter state but MUST NOT affect the trainer list.

The display MUST:
- Show only routines matching the selected trainer filter
- Update when trainer filter changes
- Show count based on filtered results
