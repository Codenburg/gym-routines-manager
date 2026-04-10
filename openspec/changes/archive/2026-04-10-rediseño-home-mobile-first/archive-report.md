# Archive Report: rediseño-home-mobile-first

## Change Summary

**Change**: rediseño-home-mobile-first
**Archived to**: `openspec/changes/archive/2026-04-10-rediseño-home-mobile-first/`
**Date**: 2026-04-10
**Mode**: hybrid (Engram + OpenSpec filesystem)

---

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| homepage | Updated | Added mobile-first redesign requirements: TrainerFilterDrawer Component, BottomNavBar Component, Trainer Filter (Desktop Pills, Mobile Bottom Drawer), Info/Feriados (Desktop Header Links, Mobile Bottom Nav Bar), Mobile Layout Order, TrainerSidebar Desktop Only, Info/Feriados Not Inline on Mobile, Modified Home Page Header (removed subtitle), Modified RoutineCard (removed "Creado por X" attribution) |

---

## Archive Contents

### Filesystem (OpenSpec)
- `openspec/changes/archive/2026-04-10-rediseño-home-mobile-first/proposal.md` ✅
- `openspec/changes/archive/2026-04-10-rediseño-home-mobile-first/spec.md` ✅
- `openspec/changes/archive/2026-04-10-rediseño-home-mobile-first/design.md` ✅
- `openspec/changes/archive/2026-04-10-rediseño-home-mobile-first/tasks.md` ✅
- `openspec/changes/archive/2026-04-10-rediseño-home-mobile-first/verify-report.md` ✅
- `openspec/changes/archive/2026-04-10-rediseño-home-mobile-first/archive-report.md` ✅

### Engram Observations (Full Artifacts)
- **#423** `sdd/rediseño-home-mobile-first/proposal` — Proposal with intent, scope, approach
- **#424** `sdd/rediseño-home-mobile-first/spec` — Delta Spec (27 scenarios, 15 acceptance criteria)
- **#425** `sdd/rediseño-home-mobile-first/design` — Technical design with component implementations
- **#426** `sdd/rediseño-home-mobile-first/tasks` — Task breakdown (31 tasks across 3 phases)
- **#427** `sdd/rediseño-home-mobile-first/verify-report` — Final verification report (15/15 AC pass)
- **#428** `sdd/rediseño-home-mobile-first/archive-report` — This archive report

---

## Implementation Summary

### New Files Created
| File | Description |
|------|-------------|
| `src/components/layout/bottom-bar.tsx` | Fixed bottom nav bar for mobile (Info + Feriados) |
| `src/components/search/trainer-filter-drawer.tsx` | Sheet-based bottom drawer for mobile trainer filter |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/info-button.tsx` | Replaced `bg-slate-*` tokens with `bg-secondary` |
| `src/components/feriados/feriados-nav-button.tsx` | Replaced `bg-slate-*` tokens with `bg-secondary` |
| `src/components/routines/routine-card.tsx` | Removed "Creado por X" attribution, simplified metrics |
| `src/components/search/trainer-sidebar.tsx` → `trainer-pills.tsx` | Desktop-only pills (`hidden lg:block`), no collapse state |
| `src/components/search/trainer-sidebar-client.tsx` | Desktop-only error state |
| `src/components/search/search-section.tsx` | TrainerFilterDrawer for mobile, Info/Feriados for desktop |
| `src/app/(public)/page.tsx` | Removed subtitle, added BottomNavBar, mobile-first layout |

---

## Key Architectural Decision

**Base UI Drawer instead of shadcn Sheet**: The project uses `@base-ui-components/react` (not Radix-based shadcn). The TrainerFilterDrawer was implemented as a wrapper around Base UI's Drawer primitive, NOT shadcn's Sheet component. This aligns with the existing stack and avoids adding `@radix-ui/react-dialog` as a peer dependency.

---

## Verification Summary

- TypeScript: **PASS** (no errors in affected files)
- ESLint: **PASS** (no warnings in affected files)
- Build: **PASS** (compiled successfully)
- Spec Compliance: **27/27 scenarios PASS**
- Acceptance Criteria: **15/15 PASS**

---

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
Ready for the next change.

---

**Engram Observation IDs for traceability:**
- Proposal: #423
- Delta Spec: #424
- Design: #425
- Tasks: #426
- Verify Report: #427
- Archive Report: #428