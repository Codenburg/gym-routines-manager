# Champion Gym — Gestor de Rutinas

v0.15.1 · Next.js 16 + React 19 + TypeScript + Tailwind v4 + Prisma + PostgreSQL

Sistema web para gestionar y visualizar rutinas de entrenamiento. Admins crean rutinas (Rutina → Día → Ejercicio), usuarios públicos las exploran. Incluye gestión de feriados, promociones y descuentos por duración.

---

## Stack

| Capa | Tech |
|------|------|
| Framework | Next.js 16.1.6 + React 19.2.3 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Estado | Zustand v5 |
| Validación | Zod v4 + React Hook Form |
| ORM / DB | Prisma v7 + PostgreSQL 18 |
| Auth | Better Auth v1 (login con DNI) |
| Testing | Playwright + Vitest |

---

## Setup

```bash
pnpm install
cp .env.example .env        # configurar DATABASE_URL y BETTER_AUTH_SECRET
docker compose up -d        # levantar PostgreSQL
pnpm dlx prisma db push
pnpm run db:seed            # opcional
pnpm run dev                # puerto 3000
```

---

## Scripts

```bash
pnpm run dev / build / start
pnpm run test / test:ui
pnpm run db:generate / db:push / db:seed / db:studio
```

---

## Modelo de datos

```
Rutina (nombre, tipo, descripcion, creador)
└── Dia (orden → display "Día N", musculosEnfocados[])
    └── Ejercicio (nombre, series, repes, orden)

Gym (singleton: price, feriados[], promociones[], descuentosDuracion[])
Promocion (titulo, descripcion, precio, activo)
DescuentoDuracion (meses, porcentaje) -- unique(gymId, meses)
User (dni, role) -- role: ADMIN | TRAINER | USER
```

---

## Estructura

```
src/
├── app/
│   ├── (admin)/admin/      # rutinas, dias, feriados
│   ├── (public)/           # home, rutinas, feriados, informacion
│   └── actions/            # Server Actions (mutaciones)
├── components/
│   ├── admin/
│   ├── routines/
│   └── ui/                 # shadcn/ui
├── lib/schemas/            # Zod schemas
└── store/                  # Zustand (theme)
```

---

## Troubleshooting

**Prisma out of sync** → `pnpm run db:generate`

**Auth no funciona** → verificar que `BETTER_AUTH_URL` coincida exactamente con la URL (sin slash final)

**DB no conecta** → verificar `DATABASE_URL` y que el contenedor Docker esté corriendo (`docker-compose ps`)

---

## Contribución
Ver [CONTRIBUTING.md](./CONTRIBUTING.md)

---
## Mis Skills
Ver [Repo de Skills](https://github.com/Codenburg/skills)