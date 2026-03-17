# Database Setup

## ADDED Requirements

### Requirement: PostgreSQL Docker Container

The development environment MUST have a PostgreSQL container running via Docker Compose.

The system MUST be able to connect to PostgreSQL using the connection string in DATABASE_URL environment variable.

#### Scenario: Docker Compose starts PostgreSQL

- GIVEN Docker Desktop is running
- WHEN developer runs `docker compose up -d`
- THEN a PostgreSQL 18.3 container MUST be created and running
- AND the container MUST be accessible on port 5432

#### Scenario: Database connection succeeds

- GIVEN PostgreSQL container is running
- WHEN Prisma Client attempts connection
- THEN the connection MUST succeed without errors

### Requirement: Prisma Schema Models

The schema.prisma file MUST define three models matching the PRD: Rutina, Dia, Ejercicio.

The system MUST enforce referential integrity between these models.

#### Scenario: Rutina model exists

- GIVEN Prisma schema is configured
- WHEN the schema is parsed
- THEN a model named "Rutina" MUST exist with fields: id, nombre, tipo, descripcion
- AND id MUST be a UUID or auto-increment integer
- AND nombre MUST be required (String)

#### Scenario: Dia model exists with relation to Rutina

- GIVEN Prisma schema is configured
- WHEN the schema is parsed
- THEN a model named "Dia" MUST exist with fields: id, nombre, musculos_enfocados
- AND Dia MUST have a required relation to Rutina (one-to-many)
- AND rutina_id MUST be stored in the database

#### Scenario: Ejercicio model exists with relation to Dia

- GIVEN Prisma schema is configured
- WHEN the schema is parsed
- THEN a model named "Ejercicio" MUST exist with fields: id, nombre, orden
- AND Ejercicio MUST have a required relation to Dia (one-to-many)
- AND dia_id MUST be stored in the database

### Requirement: Prisma Client Singleton

The application MUST use a singleton instance of PrismaClient to avoid connection leaks.

The singleton MUST be stored in the global object to persist across hot reloads in development.

#### Scenario: Prisma client is reused across requests

- GIVEN the application is running
- WHEN multiple API requests are made
- THEN the same PrismaClient instance MUST be reused
- AND the database connection pool MUST be shared

#### Scenario: Development mode creates new instance on hot reload

- GIVEN NODE_ENV is not "production"
- WHEN the server hot-reloads
- THEN a new PrismaClient instance MAY be created
- AND the previous instance SHOULD be garbage collected

### Requirement: Build includes Prisma generation

The build script MUST execute `prisma generate` before compiling the Next.js application.

#### Scenario: Build succeeds with Prisma

- GIVEN package.json has correct build script
- WHEN `npm run build` is executed
- THEN `prisma generate` MUST run first
- AND Next.js build MUST compile successfully

### Requirement: Environment variables

The system MUST have DATABASE_URL configured in .env file.

The .env file MUST NOT be committed to version control.

#### Scenario: .env file exists

- GIVEN the project is freshly cloned
- WHEN developer checks for .env
- THEN .env file MUST exist with DATABASE_URL
- AND .env MUST be in .gitignore

### Requirement: Migration execution

The database MUST be migrated to the latest schema using Prisma migrations.

#### Scenario: Migration runs successfully

- GIVEN Prisma schema is defined
- WHEN `npx prisma migrate dev` is executed
- THEN tables MUST be created in PostgreSQL
- AND the migration history MUST be stored in _prisma_migrations table

---

## Gym Singleton Configuration

This section defines requirements for the singleton Gym configuration model.

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

### Data Models

#### Gym Model

| Field     | Type     | Constraints | Description |
|-----------|----------|-------------|-------------|
| id        | String   | @id, fixed "gym" | Singleton identifier |
| price     | Decimal  | required | Monthly subscription price |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last modification timestamp |

#### Feriado Model (Modified)

| Field     | Type     | Constraints | Description |
|-----------|----------|-------------|-------------|
| id        | String   | @id @default(uuid()) | Holiday identifier |
| fecha     | DateTime | required | Holiday date |
| gymId     | String   | default "gym", indexed | Foreign key to Gym |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| gym       | Gym      | @relation(fields: [gymId], references: [id], onDelete: Cascade) | Relation to Gym |

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
