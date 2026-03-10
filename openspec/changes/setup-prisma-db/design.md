# Design: Setup Prisma 7 + PostgreSQL

## Technical Approach

Configurar Prisma 7 con PostgreSQL usando Docker Compose para desarrollo local. Se usará el adapter oficial `@prisma/adapter-pg` y el driver `pg`. El schema definirá los tres modelos del PRD con relaciones correctas.

## Architecture Decisions

### Decision: Prisma 7 Adapter Pattern

**Choice**: Usar `@prisma/adapter-pg` con driver `pg` 
**Alternatives considered**: Usar driver nativo de PostgreSQL de Prisma (no disponible en Prisma 7), usar SQLite
**Rationale**: Prisma 7 cambió a un modelo de adapters. El adapter `pg` es estable y bien mantenido.

### Decision: Docker Compose para PostgreSQL

**Choice**: PostgreSQL 18.3 en Docker Compose
**Alternatives considered**: Neon/Prisma Cloud (requiere internet), PostgreSQL nativo (difícil reset)
**Rationale**: Portable, versionable con git, reset rápido, sin dependencias externas de red

### Decision: Singleton Pattern en lib/prisma.ts

**Choice**: Exportar instancia singleton de PrismaClient
**Alternatives considered**: Crear nueva instancia en cada request (connection leaks)
**Rationale**: Next.js hot reload crea múltiples instancias en dev. Singleton en global previene agotamiento de conexiones.

### Decision: UUID como ID primary

**Choice**: Usar `uuid()` de Prisma para IDs
**Alternatives considered**: Auto-increment integer
**Rationale**: Más seguro, mejor para APIs públicas, más profesional

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
│                                                             │
│  API Routes ──→ lib/prisma.ts ──→ PrismaClient ──→ pg ──→ │
│       │              │                                       │
│       │              └── globalThis.prisma (singleton)     │
│       │                                                  │
│       │                    PostgreSQL Docker                 │
└─────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Agregar dependencias Prisma + adapter + driver |
| `docker-compose.yml` | Create | PostgreSQL 16 container |
| `prisma/schema.prisma` | Create | Modelos Rutina, Dia, Ejercicio |
| `lib/prisma.ts` | Create | Singleton PrismaClient |
| `.env` | Create | DATABASE_URL |
| `.env.example` | Create | Template para variables de entorno |
| `.gitignore` | Modify | Ignorar generated/, .env |

## Dependencies to Install

```json
{
  "prisma": "^7.0.0",
  "@prisma/client": "^7.0.0",
  "@prisma/adapter-pg": "^7.0.0",
  "pg": "^8.0.0",
  "dotenv": "^16.0.0"
}
```

## Prisma Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

model Rutina {
  id          String   @id @default(uuid())
  nombre      String
  tipo        String
  descripcion String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  dias        Dia[]
}

model Dia {
  id                  String     @id @default(uuid())
  rutinaId            String
  nombre              String
  musculosEnfocados   String?
  orden               Int        @default(0)
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt
  rutina              Rutina     @relation(fields: [rutinaId], references: [id], onDelete: Cascade)
  ejercicios          Ejercicio[]
}

model Ejercicio {
  id        String   @id @default(uuid())
  diaId     String
  nombre    String
  orden     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  dia       Dia      @relation(fields: [diaId], references: [id], onDelete: Cascade)
}
```

## lib/prisma.ts

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientSingleton }

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:18.3
    container_name: gym-routines-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: gym_user
      POSTGRES_PASSWORD: gym_password
      POSTGRES_DB: gym_routines
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Environment Variables

```bash
# .env
DATABASE_URL="postgresql://gym_user:gym_password@localhost:5432/gym_routines?schema=public"
```

```bash
# .env.example
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | Database connection | Script simple que ejecuta query |
| Manual | Prisma Studio | `npx prisma studio` para verificar |

No hay tests unitarios para configuración de DB.

## Migration / Rollout

1. `docker compose up -d` - Levantar DB
2. `npx prisma generate` - Generar cliente
3. `npx prisma migrate dev --name init` - Ejecutar migrations
4. `npm run build` - Verificar build
5. Script de verificación manual con Prisma Studio

## Open Questions

- [ ] Ninguno - Setup straightforward
