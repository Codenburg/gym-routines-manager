# Delta for Database

## MODIFIED Requirements

### Requirement: Gym Singleton Model

The system MUST store gym configuration in a singleton database record with fixed ID "gym". The record MUST include display information fields (`nombre`, `horario`, `direccion`, `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp`) in addition to the existing `price` field.
(Previously: Singleton Gym record with only `id` and `price`.)

#### Scenario: Create Gym singleton record

- GIVEN No Gym record exists in the database
- WHEN The seed script executes
- THEN A Gym record with id "gym" and price 45000 MUST be created
- AND display information fields MUST be NULL by default until an admin configures them

#### Scenario: Gym record persists across deployments

- GIVEN A Gym record with id "gym" already exists in the database
- WHEN The seed script executes
- THEN The existing Gym record MUST NOT be modified (upsert behavior)

#### Scenario: Gym stores display information

- GIVEN An admin saves gym configuration values for nombre, horario, direccion, mapsEmbedUrl, socialInstagram, socialWhatsapp
- WHEN The Gym record is updated
- THEN All six new fields MUST be persisted alongside the existing `price` field
- AND subsequent reads MUST return the updated values

### Requirement: Gym Display Fields Schema

The Gym model MUST expose six new optional String fields for admin-managed display content. All fields are nullable; the application layer is responsible for fallback handling when a field is NULL.
(Previously: Gym model only contained `id`, `price`, `createdAt`, `updatedAt`.)

#### Scenario: New display fields exist on Gym model

- GIVEN Prisma schema is configured
- WHEN the schema is parsed
- THEN the Gym model MUST include: `nombre`, `horario`, `direccion`, `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp`
- AND all six fields MUST be of type `String?` (nullable)

#### Scenario: Additive migration adds columns without data loss

- GIVEN A database with an existing Gym record containing `price = 45000`
- WHEN `npx prisma migrate dev` runs the additive migration
- THEN the six new String columns MUST be added to the Gym table
- AND the existing `price`, `createdAt`, `updatedAt` data MUST be preserved
- AND existing Gym records MUST have NULL for all new fields

#### Scenario: Long address text supported

- GIVEN An admin enters a `direccion` value longer than 200 characters
- WHEN the Gym record is saved
- THEN the value MUST be persisted without truncation (use `@db.Text` for unbounded text)

#### Scenario: URL fields accept embed-sized strings

- GIVEN An admin enters a `mapsEmbedUrl` value with query parameters
- WHEN the Gym record is saved
- THEN the value MUST be persisted as-is (validation is the application's responsibility)

### Data Model: Gym (Extended)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | String | @id, fixed "gym" | Singleton identifier |
| price | Decimal | required | Monthly subscription price |
| nombre | String? | nullable | Display name shown in headers, metadata, login |
| horario | String? | @db.Text, nullable | Operating hours text (e.g., "Lun-Vie 7:00-22:00") |
| direccion | String? | @db.Text, nullable | Physical address |
| mapsEmbedUrl | String? | @db.Text, nullable | Google Maps embed iframe URL |
| socialInstagram | String? | nullable | Full Instagram profile URL |
| socialWhatsapp | String? | nullable | Full WhatsApp contact URL (wa.me format) |
| createdAt | DateTime | @default(now()) | Record creation timestamp |
| updatedAt | DateTime | @updatedAt | Last modification timestamp |
