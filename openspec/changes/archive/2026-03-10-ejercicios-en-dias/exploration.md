# Exploration: Ejercicios en Días de Rutina

## Current State

### Database Schema
- **Rutina** → has many **Dia**
- **Dia** → has many **Ejercicio**
- Current seed creates 4 routines with days, but **NO ejercicios**

### API
- `GET /api/rutinas/[id]` returns rutina with dias and ejercicios (empty array)
- No endpoint to fetch single day with ejercicios

### UI
- `/rutinas/[id]` shows days as cards
- Cards are **NOT clickable** - just display content
- Shows "No hay ejercicios configurados" for all days

## Affected Areas

| File | Why |
|------|-----|
| `prisma/seed.ts` | Need to add ejercicios to seed data |
| `app/rutinas/[id]/page.tsx` | Make day cards clickable |
| `app/api/rutinas/[id]/route.ts` | Existing - returns days with ejercicios |
| `app/api/rutinas/[id]/dias/[diaId]/route.ts` | **NEW** - endpoint for single day |
| `app/rutinas/[id]/dias/[diaId]/page.tsx` | **NEW** - day detail page |
| `tests/rutina-detail.spec.ts` | Add tests for new functionality |

## Approaches

### Approach A: Full Feature (Recommended)
Add complete functionality:
1. Update seed data with ejercicios
2. Make day cards clickable (Link to day page)
3. Create new API endpoint for day detail
4. Create new page for day detail
5. Add tests

**Effort**: Medium | **Pros**: Complete user flow | **Cons**: More files to create

### Approach B: Minimal
Just show ejercicios inline in existing day cards (not clickable)
1. Update seed data with ejercicios
2. Show full ejercicio list in each day card

**Effort**: Low | **Pros**: Quick | **Cons**: Doesn't match user request ("clickeable que lleve al dia")

## Recommendation

**Approach A** - Full Feature

The user explicitly asked for:
- Day cards to be clickeable
- Navigate to day page
- Show list of ejercicios

This requires:
1. New API endpoint: `GET /api/rutinas/[id]/dias/[diaId]`
2. New page: `/rutinas/[id]/dias/[diaId]`
3. Update seed to include ejercicios
4. Make cards clickable with Next.js Link

## Risks

- Need to regenerate Prisma client after schema changes (none needed - schema already supports ejercicios)
- Seed data reset required to see new ejercicios
- Test IDs will change if seed is reset

## Ready for Proposal

Yes. Feature is well-defined: clickeable day cards → day detail page with ejercicios list.
