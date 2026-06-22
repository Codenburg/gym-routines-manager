<div align="center">

# gymflow

**Plataforma de gestión para gimnasios** — rutinas, configuración, feriados, promociones y descuentos. Cara pública para usuarios, panel admin para gestión.

v1.0.2

![Next.js 16](https://img.shields.io/badge/Next.js-16.2.9-000?style=flat-square&logo=next.js&logoColor=white)
![React 19](https://img.shields.io/badge/React-19.2.7-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Prisma 7](https://img.shields.io/badge/Prisma-7.8.0-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL 18](https://img.shields.io/badge/PostgreSQL-18-336791?style=flat-square&logo=postgresql&logoColor=white)

[Features](#-features) · [Stack](#-stack) · [Quick Start](#-quick-start) · [Roadmap](#-roadmap) · [Specs](./openspec/)

</div>

---

## ✨ Features

### 🏋️ Admin panel

- **Rutinas** (Rutina → Día → Ejercicio) con drag-and-drop (`@dnd-kit`), soft-delete y aislamiento por trainer.
- **Configuración del gimnasio**: nombre, horarios estructurados (Lun a Dom), dirección, redes sociales, precio de inscripción.
- **Feriados** con horarios parciales y reglas de fechas pasadas.
- **Promociones y descuentos por duración** (1, 3, 6, 12 meses) con admin CRUD.
- **Trainers** (ADMIN-only): gestión de personal con soft-delete y rutinas propias.
- **Auth DNI-based** con roles (ADMIN, TRAINER, USER) y audit trail.
- **Dashboard** con stats en vivo, error boundaries y fallbacks degradados.
- **Mobile-responsive** (header fixed, drawer para nav, content offset por viewport).

### 🌐 Public site

- **Home** con listado y búsqueda unificada (debounce + URL como source of truth).
- **Detalle de rutina** con días y ejercicios.
- **Página de información** del gimnasio (horarios app-controlled, dirección, redes, mapa embed).
- **Notificación de feriados nuevos** (throttle de 5min en window focus).

### 🛠️ Technical

- **Cache Components** de Next 16 (`'use cache'` + `cacheTag` + `cacheLife`) — invalidación quirúrgica por tag.
- **Server Actions** para mutaciones con revalidación de cache automática.
- **Zod-validated schemas** en formularios (validación client + server).
- **Prisma 7** con PostgreSQL 18, ownership audit trail y soft delete.
- **GGA pre-commit hook** (opt-in via `bash scripts/install-gga-hook.sh`): diff-only review + `.gga-ignore` escape hatch + kill switch `GGA_DIFF_FILTER=off`.
- **Tests**: 26+ E2E con page objects, 151 unit (Vitest), suite total de 245 Playwright tests.

---

## 🧱 Stack

| Capa            | Tech                                                            |
|-----------------|-----------------------------------------------------------------|
| Framework       | Next.js 16.2.9 + React 19.2.7                                   |
| Cache           | `'use cache'` + `cacheTag` + `cacheLife` (v0.19.0 migration)    |
| Estilos         | Tailwind CSS v4 + shadcn/ui                                     |
| Estado          | Zustand v5                                                      |
| Validación      | Zod v4 + React Hook Form                                        |
| ORM / DB        | Prisma 7 + PostgreSQL 18                                        |
| Auth            | Better Auth v1 (login con DNI)                                  |
| Testing         | Playwright + Vitest                                             |
| Pre-commit      | GGA v2.8.1 (Gentleman Guardian Angel)                           |
| Package manager | pnpm 11.2.2                                                     |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **pnpm 11+** (`corepack enable` o `npm i -g pnpm`)
- **PostgreSQL 18+** (local o via Docker)
- **Docker** (opcional, para DB en container)

### Install

```bash
# 1. Clonar e instalar deps
git clone https://github.com/Codenburg/gymflow.git
cd gymflow
pnpm install

# 2. Configurar env
cp .env.example .env
# editar .env con DATABASE_URL y BETTER_AUTH_SECRET

# 3. Levantar DB (Docker)
docker compose up -d

# 4. Aplicar schema + seed (opcional)
pnpm dlx prisma db push
pnpm run db:seed

# 5. Dev server
pnpm run dev
# → http://localhost:3000
```

### Login de prueba (después del seed)

| Rol     | DNI       | Password   |
|---------|-----------|------------|
| ADMIN   | 11111111  | nando123   |

---

## ⚙️ Configuration

Variables de entorno principales (ver `.env.example` para la lista completa):

| Variable                    | Default                 | Descripción                                       |
|-----------------------------|-------------------------|---------------------------------------------------|
| `DATABASE_URL`              | —                       | Connection string de PostgreSQL                   |
| `BETTER_AUTH_SECRET`        | —                       | Secret para firmar sesiones (generar con `openssl rand -base64 32`) |
| `BETTER_AUTH_URL`           | `http://localhost:3000` | URL del app (sin slash final)                     |
| `NEXT_PUBLIC_GYM_NAME`      | `"Gimnasio"`            | Fallback del nombre del gym (DB tiene prioridad)  |

---

## 📜 Scripts

| Script                 | Descripción                                           |
|------------------------|-------------------------------------------------------|
| `pnpm run dev`         | Dev server (Turbopack) en `:3000`                     |
| `pnpm run build`       | Build de producción                                   |
| `pnpm run start`       | Servir build de producción                            |
| `pnpm run lint`        | ESLint                                                |
| `pnpm test`            | Playwright (requiere dev server corriendo)            |
| `pnpm run test:fast`   | Suite E2E rápida (excluye `@slow`)                   |
| `pnpm run test:ui`     | Playwright con UI mode                                |
| `pnpm run test:unit`   | Vitest (unit tests, no necesita dev server)           |
| `pnpm run test:unit:watch` | Vitest en watch mode                              |
| `pnpm run db:seed`     | Seed de la DB (admin, datos de ejemplo)               |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (admin)/admin/      # Panel admin: rutinas, feriados, promos, descuentos, trainers, config
│   ├── (public)/           # Home, listado/detalle de rutinas, /informacion
│   └── actions/            # Server Actions (mutaciones con revalidatePath/Tag)
├── components/
│   ├── admin/              # AdminLayout, AdminSidebar, forms, tables
│   ├── routines/           # Rutina cards, exercise forms, drag-and-drop
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── schemas/            # Zod schemas (validation source of truth)
│   └── auth/               # Better Auth config + helpers
└── store/                  # Zustand stores (theme)

openspec/                   # Specs, design docs, archive de SDD cycles
├── ROADMAP.md              # Roadmap vivo (single source of truth)
├── CHANGELOG.md            # Changelog
├── specs/                  # Delta specs de features shipped
└── changes/                # SDD cycles activos + archive histórico

tests/                      # E2E (Playwright) + unit (Vitest)
├── helpers.ts              # Login/logout helpers + reset utilities
├── page-objects/           # Page Object Model
└── utils/                  # Shared test utilities (prisma reset, etc)

scripts/                    # Setup scripts (GGA hook installer, etc)
```

---

## 🧪 Testing

- **Unit (Vitest)**: rápido, no necesita dev server. Cubre schemas, formaters, helpers. Correr con `pnpm run test:unit`.
- **E2E (Playwright)**: suite completa con Page Object Model. Requiere dev server. Correr con `pnpm test` o `pnpm run test:fast` (excluye tests `@slow`).
- **Cobertura actual**: 26+ E2E scenarios, 151 unit tests, 245 Playwright tests totales.

Antes de pushear: `pnpm run lint && pnpm run test:fast`.

---

## 🗺️ Roadmap

El roadmap vivo está en **[`openspec/ROADMAP.md`](./openspec/ROADMAP.md)** (single source of truth).

**Highlights actuales**:

- 🔴 **Alta Prioridad**: [Multi-tenant SaaS — path a gymflow](./openspec/ROADMAP.md#alta-prioridad) — convertir el proyecto en plataforma multi-tenant (Slice 0 ya ejecutado: rename a `gymflow`).
- 🟡 **Pendiente**: tests E2E con cobertura completa, documentación de API, generación de PDF por rutina.
- 🟢 **Baja**: exportación CSV, i18n, PWA support, generación de PDF.
- 🆕 **Features post-1.0 candidates**: reglas del gym, vaciar campos opcionales de gym config.

**Política de bumps** ([detalle completo](./openspec/ROADMAP.md#-pending-fixes-accumulating-for-next-patch-bump)):
🔴 1 hotfix → bump · 🟡 2 fixes media → bump · 🟢 3 fixes baja → bump.

---

## 📐 Specs

Las specs técnicas viven en **`openspec/specs/`** (delta specs de features shipped) y **`openspec/changes/`** (SDD cycles activos y archive). Cada feature nueva sigue el workflow `/sdd-new <feature>` → proposal → design → tasks → apply → verify → archive.

---

## 🤝 Contributing

Ver [CONTRIBUTING.md](./CONTRIBUTING.md). Setup del pre-commit hook (GGA, opt-in): `bash scripts/install-gga-hook.sh`.

---

## 🛠️ Troubleshooting

**Prisma out of sync** → `pnpm run db:generate`

**Auth no funciona** → verificar que `BETTER_AUTH_URL` coincida exactamente con la URL (sin slash final)

**DB no conecta** → verificar `DATABASE_URL` y que el contenedor Docker esté corriendo (`docker compose ps`)

**Tests E2E flakean** → `pnpm run test:fast` excluye tests marcados `@slow`. Para suite completa, asegurar DB seeded y dev server estable.

---
