# Delta for Database

## Purpose

This spec defines the database schema changes required to implement the singleton Gym configuration pattern, replacing hardcoded price constants with a centralized database model.

## ADDED Requirements

### Requirement: Gym Singleton Model

The system MUST store gym configuration in a singleton database record with fixed ID "gym".

#### Scenario: Create Gym singleton record

- GIVEN No Gym record exists in the database
- WHEN The seed script executes
- THEN A Gym record with id "gym" and price 45000 MUST be created

#### Scenario: Gym record persists across deployments

- GIVEN A Gym record with id "gym" already exists in the database
- WHEN The seed script executes
- THEN The existing Gym record MUST NOT be modified (upsert behavior)

### Requirement: Feriado Gym Relation

The system MUST associate each Feriado (holiday) record with a Gym for data integrity and future multi-gym support.

#### Scenario: New Feriado created with gym relation

- GIVEN A Gym record exists with id "gym"
- WHEN A new Feriado is created via API
- THEN The Feriado MUST have gymId set to "gym" automatically

#### Scenario: Delete Gym cascades to Feriados

- GIVEN Multiple Feriado records exist with gymId "gym"
- WHEN The Gym record is deleted
- THEN All associated Feriado records MUST be deleted automatically (Cascade)

#### Scenario: Gym index query performance

- GIVEN Application frequently queries Feriados by gymId
- WHEN The database receives a query filtering by gymId
- THEN The query MUST utilize an index on gymId for optimal performance

### Requirement: Price Decimal Precision

The system MUST handle monetary values with appropriate precision to avoid floating-point errors.

#### Scenario: Store price as Decimal

- GIVEN A price value of 45000.50 is provided
- WHEN The Gym record is created/updated
- THEN The price MUST be stored with at least 2 decimal places of precision

## Data Models

### Gym Model

| Field     | Type     | Constraints | Description |
|-----------|----------|-------------|-------------|
| id        | String   | @id, fixed "gym" | Singleton identifier |
| price     | Decimal  | required | Monthly subscription price |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last modification timestamp |

### Feriado Model (Modified)

| Field     | Type     | Constraints | Description |
|-----------|----------|-------------|-------------|
| id        | String   | @id @default(uuid()) | Holiday identifier |
| fecha     | DateTime | required | Holiday date |
| gymId     | String   | default "gym", indexed | Foreign key to Gym |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| gym       | Gym      | @relation(fields: [gymId], references: [id], onDelete: Cascade) | Relation to Gym |

## Migration Requirements

### Requirement: Migration Safety

The system MUST ensure migrations can be applied safely to existing databases without data loss.

#### Scenario: Apply migration to fresh database

- GIVEN No tables exist in the database
- WHEN `npx prisma migrate dev` is executed
- THEN Both Gym and modified Feriado tables MUST be created successfully

#### Scenario: Apply migration with existing Feriados

- GIVEN A database with existing Feriado records but no Gym table
- WHEN The migration runs
- THEN All existing Feriado records MUST receive gymId = "gym" as default
- AND No existing data MUST be lost

## Acceptance Criteria

- [ ] Gym model exists with id, price (Decimal), createdAt, updatedAt fields
- [ ] Feriado model has gymId field with default "gym"
- [ ] Feriado has mandatory relation to Gym with Cascade delete
- [ ] Index exists on Feriado.gymId
- [ ] Seed script creates/updates Gym with id "gym" and price 45000
- [ ] Migration handles existing Feriado records gracefully
