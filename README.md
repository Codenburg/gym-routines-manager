# Champion Gym - Gestor de Rutinas de Gimnasio

v0.1.0 | Last updated: 2026-03-27

Sistema web para gestionar y visualizar rutinas de entrenamiento de gimnasio. Administradores crean rutinas estructuradas (Rutina → Día → Ejercicio). Usuarios públicos exploran, visualizan y descargan rutinas en PDF.

---

## Tech Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16.1.6 + React 19.2.3 |
| Lenguaje | TypeScript ^5 |
| Estilos | Tailwind CSS ^4 + shadcn/ui |
| Estado | Zustand ^5.0.11 |
| Validación | Zod ^4.3.6 + React Hook Form ^7.71.2 |
| ORM | Prisma ^7.4.2 |
| Base de datos | PostgreSQL 18.3 |
| Auth | Better Auth ^1.5.4 |
| Testing | Playwright ^1.58.2 |
| React DOM | 19.2.3 |

---

## Características

### Público
- Exploración de rutinas por nombre y tipo
- Visualización detallada de rutinas con días y ejercicios
- ~~Generación de PDF por rutina~~ ⏳ (pendiente)
- Página de información del gimnasio

### Administrador
- Login con DNI
- CRUD completo de rutinas, días y ejercicios
- Ordenamiento drag-and-drop de ejercicios
- Edición de precio de inscripción
- Gestión de feriados (días no laborables)
- Duplicado de rutinas
- Tema claro/oscuro

---

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Rutas del panel admin
│   │   ├── admin/
│   │   │   ├── rutinas/  # CRUD de rutinas
│   │   │   ├── dias/     # Gestión de días
│   │   │   └── feriados/  # Gestión de feriados
│   │   └── login/        # Login admin
│   ├── (auth)/           # Auth routes
│   ├── (public)/         # Rutas públicas
│   │   ├── page.tsx      # Home + listado de rutinas
│   │   ├── rutinas/      # Detalle de rutinas
│   │   ├── dias/         # Detalle de días
│   │   ├── feriados/     # Feriados públicos
│   │   └── informacion/  # Página de información
│   ├── actions/          # Server Actions
│   └── globals.css       # Tailwind + variables de tema
├── components/
│   ├── admin/            # Componentes del panel admin
│   ├── routines/         # Componentes de rutinas
│   ├── search/           # Búsqueda y filtros
│   ├── ui/               # shadcn/ui components
│   └── theme-toggle.tsx  # Toggle claro/oscuro
├── lib/
│   ├── auth-client.ts    # Better Auth client
│   └── schemas/          # Zod schemas
├── store/
│   └── theme-store.ts    # Zustand theme store
└── types/                # Tipos compartidos
```

---

## Modelo de Datos

```
Rutina
├── id (UUID)
├── nombre
├── tipo (fuerza | cardio | flexibilidad | hipertrofia)
├── descripcion
├── creador
├── dias[]
│   └── Dia
│       ├── id (UUID)
│       ├── nombre
│       ├── musculosEnfocados
│       ├── orden
│       └── ejercicios[]
│           └── Ejercicio
│               ├── id (UUID)
│               ├── nombre
│               ├── series
│               ├── repes
│               └── orden

Gym (singleton)
├── id = "gym"
├── price
└── feriados[]

User (Better Auth)
├── id, name, dni, username, email
├── admin: boolean
└── role: "admin" | "user"
```

---

## Requisitos

- Node.js 20+
- PostgreSQL 18+
- npm

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd gym-routines-manager

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Generar cliente Prisma
npx prisma generate

# 5. Crear base de datos
npx prisma db push

# 6. (Opcional) Seed de datos iniciales
npm run db:seed

# 7. Iniciar dev server
npm run dev
```

---

## Docker (Opcional)

Si prefieres usar Docker para PostgreSQL:

```bash
# Iniciar PostgreSQL en Docker
docker-compose up -d

# La DATABASE_URL debe ser:
DATABASE_URL="postgresql://gym_user:gym_password@localhost:5432/gym_routines"
```

El archivo `docker-compose.yml` usa:
- Imagen: `postgres:18.3`
- Puerto: `5432`
- Credenciales por defecto: `gym_user` / `gym_password`
- Base de datos: `gym_routines`
- Volumen: `postgres_data` para persistencia de datos

---

## Deployment

### Vercel (Recomendado)

Vercel es la plataforma recomendada para desplegar Next.js.

1. Conectar el repositorio a Vercel
2. Configurar las variables de entorno:
   - `DATABASE_URL` — URL de PostgreSQL
   - `BETTER_AUTH_SECRET` — Secret para autenticación (32+ caracteres)
   - `BETTER_AUTH_URL` — URL de producción (ej: `https://tu-dominio.vercel.app`)

### Railway (Alternativo)

Railway es una alternativa para desplegar Next.js con PostgreSQL.

1. Crear proyecto en Railway
2. Añadir plugin PostgreSQL
3. Configurar variables de entorno:
   - `DATABASE_URL` — Proveído por Railway
   - `BETTER_AUTH_SECRET` — Secret para autenticación (32+ caracteres)
   - `BETTER_AUTH_URL` — URL de producción

---

## Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/gym_routines"

# Auth (Better Auth)
BETTER_AUTH_SECRET="tu-secret-de-32-chars-minimo"
BETTER_AUTH_URL="http://localhost:3000"
```

---

## Scripts Disponibles

```bash
npm run dev          # Dev server en puerto 3000
npm run build        # Build de producción (incluye prisma generate)
npm run start        # Iniciar producción
npm run lint         # ESLint
npm run test         # Playwright tests
npm run test:ui      # Playwright con UI
npm run db:seed      # Seed de datos
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Push schema a la base de datos
npm run db:studio    # Abrir Prisma Studio
```

---

## Arquitectura

### Server Actions

Toda la mutación de datos va por Server Actions en `src/app/actions/`:

| Action | Descripción |
|--------|-------------|
| `createRutina` | Crear rutina simple |
| `createRutinaCompleta` | Crear rutina con días y ejercicios |
| `updateRutina` | Actualizar rutina |
| `deleteRutina` | Eliminar rutina (cascade) |
| `duplicateRutina` | Duplicar rutina con todos sus días/ejercicios |
| `createDia` | Crear día |
| `updateDia` | Actualizar día |
| `deleteDia` | Eliminar día (cascade) |
| `createEjercicio` | Crear ejercicio |
| `updateEjercicio` | Actualizar ejercicio |
| `deleteEjercicio` | Eliminar ejercicio |
| `reorderEjercicios` | Reordenar ejercicios |
| `createFeriado` | Agregar feriados |
| `deleteFeriado` | Eliminar feriados |
| `updateGymPrice` | Editar precio de inscripción |

### Cache Invalidation

Se usa `revalidatePath` y `revalidateTag` para invalidar cache de Next.js después de mutaciones.

### Theme

El tema se maneja con Zustand store (`theme-store.ts`) y CSS custom properties en `globals.css`. El `ThemeProvider` aplica la clase `light` u `oscuro` al `<html>`.

---

## Convenciones

### UI Components
- Todos los componentes de UI usan **shadcn/ui**
- No crear componentes custom para: button, input, select, dialog, dropdown, card
- Agregar componentes con: `npx shadcn@latest add <componente>`

### CSS Variables
El proyecto usa CSS custom properties para theming:

| Variable | Uso |
|----------|-----|
| `--foreground` | Texto principal |
| `--muted-foreground` | Texto secundario |
| `--background` | Fondo de página |
| `--card-bg` | Fondo de cards |
| `--destructive` | Acciones peligrosas |
| `--success` | Mensajes de éxito |
| `--button-primary-bg` | Botones primarios |

### Código
- Function components únicamente (no class components)
- Server Components por defecto; opt-in a Client Components con `"use client"`
- Mensajes de error en español

---

## Troubleshooting / FAQ

### Prisma client out of sync
Si después de actualizar dependencias tenés errores de Prisma, ejecutá:
```bash
npm run db:generate
```

### Database connection errors
1. Verify `DATABASE_URL` is correctly set in `.env`
2. If using Docker, verify the container is running: `docker-compose ps`
3. Check Docker logs: `docker-compose logs postgres`

### Auth issues
1. Verify `BETTER_AUTH_SECRET` is set (32+ characters recommended)
2. Verify `BETTER_AUTH_URL` matches your production URL exactly
3. For local development, ensure `BETTER_AUTH_URL="http://localhost:3000"`

---

## TODO — Estado del Proyecto

### ✅ Completado

#### Funcionalidades
- [x] Exploración de rutinas por nombre y tipo
- [x] Visualización detallada de rutinas con días y ejercicios
- [x] Login administrador con DNI (Better Auth)
- [x] CRUD completo de rutinas, días y ejercicios
- [x] Ordenamiento drag-and-drop de ejercicios (@dnd-kit)
- [x] Duplicado de rutinas
- [x] Edición de precio de inscripción
- [x] Gestión de feriados (días no laborables)
- [x] Tema claro/oscuro con persistencia
- [x] Notificación badge de feriados nuevos
- [x] Horarios parciales en feriados (hora_inicio, hora_fin)
- [x] Prevención de feriados duplicados (unique date constraint)
- [x] Página de información del gimnasio
- [x] Búsqueda unificada con debounce y URL como source of truth

#### Técnico
- [x] Next.js 16.1.6 + React 19.2.3
- [x] TypeScript strict mode
- [x] Tailwind CSS v4 + shadcn/ui
- [x] Zustand para estado global (theme)
- [x] Zod v4 + React Hook Form para validación
- [x] Prisma ORM con PostgreSQL 18.3
- [x] Server Actions para mutaciones
- [x] Cache invalidation con revalidatePath/revalidateTag
- [x] unstable_cache para rutinas
- [x] Ownership audit trail en base de datos
- [x] User soft delete
- [x] Unit tests con Vitest
- [x] E2E tests con Playwright

#### Documentación
- [x] README.md actualizado
- [x] PRD.md con roadmap y fases
- [x] Specs en openspec/

---

### ⏳ Pendiente

#### Alta Prioridad
- [ ] Tests E2E覆盖率 completa (Playwright) — Fase 4
- [ ] Documentación de API (MDX-based)

#### Media Prioridad
- [ ] Generación de PDF por rutina (@react-pdf/renderer)
- [ ] Cache warming cron para SEO

#### Baja Prioridad
- [ ] Exportación CSV de rutinas
- [ ] i18n (multi-idioma)
- [ ] PWA support (offline PDF access)
- [ ] Multi-gym support

#### Deferred (baja traffic actual)
- [ ] Optimización de rendimiento avanzada (lazy loading, code splitting)

---

## Contribución

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para guías de contribución.

---

## Licencia

UNLICENSED
