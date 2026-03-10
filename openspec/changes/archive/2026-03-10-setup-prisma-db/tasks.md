# Tasks: Setup Prisma 7 + PostgreSQL 18.3

## Phase 1: Dependencies Installation

- [x] 1.1 Install Prisma 7: `npm install prisma@^7 @prisma/client@^7 --save-dev`
- [x] 1.2 Install PostgreSQL adapter: `npm install @prisma/adapter-pg@^7 pg@^8 dotenv@^16 --save`
- [x] 1.3 Initialize Prisma: `npx prisma init --datasource-provider postgresql`

## Phase 2: Docker Setup

- [x] 2.1 Create `docker-compose.yml` with PostgreSQL 18.3
- [x] 2.2 Update `.env` with DATABASE_URL for local PostgreSQL
- [x] 2.3 Create `.env.example` template
- [x] 2.4 Update `.gitignore` to exclude `generated/`, `.env`

## Phase 3: Prisma Schema

- [x] 3.1 Create `prisma/schema.prisma` with datasource and generator config
- [x] 3.2 Define `Rutina` model (id, nombre, tipo, descripcion, timestamps)
- [x] 3.3 Define `Dia` model with relation to Rutina (one-to-many)
- [x] 3.4 Define `Ejercicio` model with relation to Dia (one-to-many)
- [x] 3.5 Add CASCADE delete on relations

## Phase 4: Prisma Client Singleton

- [x] 4.1 Create `lib/prisma.ts` with singleton pattern using PrismaPg adapter
- [x] 4.2 Export default prisma instance

## Phase 5: Build Configuration

- [x] 5.1 Update `package.json` build script to: `"build": "prisma generate && next build"`
- [x] 5.2 Add "postinstall" script: `"postinstall": "prisma generate"`

## Phase 6: Database Setup

- [x] 6.1 Start Docker: `docker compose up -d`
- [x] 6.2 Generate Prisma Client: `npx prisma generate`
- [x] 6.3 Run initial migration: `npx prisma migrate dev --name init`
- [ ] 6.4 Verify with Prisma Studio: `npx prisma studio` (optional)

## Phase 7: Verification

- [x] 7.1 Test build: `npm run build`
- [x] 7.2 Verify tables created: connect to DB and check `_prisma_migrations`
- [ ] 7.3 Test connection: create simple script that queries DB via Prisma

## Implementation Order

1. Install dependencies (1.x) — must come first
2. Docker setup (2.x) — DB must run before migrations
3. Schema (3.x) — defines the data structure
4. Singleton (4.x) — uses generated client
5. Build config (5.x) — needs schema to exist
6. Database (6.x) — runs migrations
7. Verification (7.x) — final check
