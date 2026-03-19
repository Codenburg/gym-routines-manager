# Champion Gym - Gestor de Rutinas de Gimnasio

Sistema web para gestionar y visualizar rutinas de entrenamiento de gimnasio. Administradores crean rutinas estructuradas (Rutina → Día → Ejercicio). Usuarios públicos exploran, visualizan y descargan rutinas en PDF.

---

## Tech Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 + React 19 |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Estado | Zustand 5 |
| Validación | Zod 4 + React Hook Form 7 |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL 18 |
| Auth | Better Auth |
| Testing | Playwright |

---

## Características

### Público
- Exploración de rutinas por nombre y tipo
- Visualización detallada de rutinas con días y ejercicios
- Generación de PDF por rutina
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
npm run build        # Build de producción
npm run start        # Iniciar producción
npm run lint         # ESLint
npm run test         # Playwright tests
npm run test:ui      # Playwright con UI
npm run db:seed      # Seed de datos
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

## Licencia

Privado - Champion Gym
