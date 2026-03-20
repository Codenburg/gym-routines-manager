# Proposal: Fix Trainer Chips Disappearing Bug

## Summary

When selecting a trainer filter chip (e.g., "Nando"), all other trainer chips disappear instead of remaining visible. This indicates that the filtered state is overwriting the original data source instead of being applied as a derived view.

## Problem Statement

The current architecture derives the trainer list from already-filtered routines:

```
User clicks trainer → URL updates → Server re-renders → 
getCachedRutinas(search, trainers) → Returns FILTERED routines →
extractTrainers(filtered_rutinas) → Only selected trainer remains
```

This causes:
1. Chips to disappear when filtered
2. No way to select multiple trainers since only one appears
3. Inconsistent UX where the filter UI changes based on filter state

## Intent

Separate the stable trainer data source from the filtered routines display. Chips must always render from the complete trainer dataset (truth derived from `{ data }`), while filtered content derives dynamically without mutating or replacing the base list.

## Scope

**In scope:**
- Fix trainer chip rendering to always show all trainers
- Ensure filtered content derives from full dataset
- Maintain toggle functionality (select/deselect without losing options)
- Preserve DataResult pattern consistency

**Out of scope:**
- Changes to the database schema
- Changes to the trainer filter API behavior
- Changes to the admin panel

## Approach

Modify `getCachedRutinas` to return two separate data structures:
1. `rutinas`: filtered routines based on search/trainers params
2. `trainers`: ALL trainers derived from unfiltered data (stable for chips)

This requires two database queries:
1. Query for trainers WITHOUT trainer filter (for stable chip list)
2. Query for rutinas WITH all filters (for display)

## Success Criteria

- [ ] All trainer chips remain visible regardless of filter state
- [ ] Selecting a chip filters routines correctly
- [ ] Toggling chips works (select/deselect)
- [ ] Multiple chip selection works
- [ ] "Todos" clears all filters and shows all routines
- [ ] Pattern consistency with `{ data, error }` DataResult approach maintained
