# Proposal: Singleton Gym Configuration

## Intent

Currently, gym configuration (name, address, hours, price) is hardcoded across multiple frontend files with values like `$45.000` in `src/app/informacion/page.tsx`, "Champion Gym" name, "Sargento Cabral 545" address, and hours 8:00-22:00. This creates maintenance burden and prevents runtime configuration by admins. The intent is to create a singleton Gym model in the database that can be edited at runtime, centralizing all gym configuration in one place.

## Scope

### In Scope
- Create `Gym` model in Prisma schema with id: "gym" (not UUID), price (Decimal), createdAt, updatedAt
- Modify `Feriado` model: add gymId String field with default "gym", mandatory relation to Gym, index on gymId
- Create/update seed file to upsert gym singleton with id "gym" and price 45000
- Create API route GET /api/gym returning singleton gym configuration
- Create API route PATCH /api/gym for updating gym price
- Frontend admin: add price display component with edit button (numeric input + save)
- Remove all hardcoded price constants from frontend code

### Out of Scope
- Hours and address configuration (future enhancement)
- Multiple gym support (single tenant for now)
- Gym name display changes

## Approach

1. **Database**: Add Gym model with singleton pattern (id: "gym"), modify Feriado to have required gymId relation with index
2. **Seed**: Create upsert in seed.ts to ensure gym singleton exists with default price
3. **API**: Create Next.js route handlers for GET/PATCH /api/gym using Prisma
4. **Frontend**: Create admin component that fetches price from API, allows edit with numeric input, calls PATCH on save

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add Gym model, modify Feriado with gymId relation |
| `prisma/seed.ts` | Modified | Add gym upsert logic |
| `src/app/api/gym/route.ts` | New | GET and PATCH handlers for gym singleton |
| `src/app/informacion/page.tsx` | Modified | Remove hardcoded price constant |
| `src/app/admin/` or similar | New | Add price display/edit component |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migration conflicts with existing data | Low | Use default "gym" for existing Feriados |
| Price display formatting issues | Medium | Use proper Decimal handling in Prisma/JS |
| API route auth not enforced | Medium | Add admin-only middleware to /api/gym PATCH |

## Rollback Plan

1. Revert Prisma schema changes
2. Run `npx prisma migrate dev` to rollback
3. Revert seed.ts changes
4. Delete API route file
5. Re-add hardcoded constants in frontend

## Dependencies

- Prisma setup already exists (database/spec.md)
- Better Auth admin role exists (User.admin field)

## Success Criteria

- [ ] GET /api/gym returns {"id": "gym", "price": 45000}
- [ ] PATCH /api/gym updates price successfully
- [ ] Frontend admin page shows current price from API
- [ ] Editing price and saving persists to database
- [ ] No hardcoded $45.000 in informacion page
