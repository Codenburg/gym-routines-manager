# Guía de Contribución

## ⚠️ Reglas Críticas

**GIT:**
- **NEVER** ejecutar `git reset` (hard, soft, mixed) sin permiso explícito del usuario
- **NEVER** ejecutar `git rebase` interactivo sin permiso explícito
- Antes de cualquier operación destructiva, **STOP y PREGUNTAR**

**Code Review — REJECT si:**
- Secrets/credentials hardcoded
- `console.log` en código de producción
- Error handling faltante

## Workflow

1. Crear branch desde `dev`: `git checkout -b feature/nombre`
2. Trabajar en la feature
3. Commitear con conventional commits: `git commit -m "feat: description"`
4. Push: `git push -u origin feature/nombre`
5. Crear PR a `dev`
6. Code review
7. Merge

## Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: bug fix
docs: documentación
style: formatting (sin cambio de código)
refactor: refactor
test: tests
chore: mantenimiento
```

## SDD (Spec-Driven Development)

Para features significativas, usar el workflow SDD:

```
/sdd-init                          # Inicializar contexto
/sdd-explore <topic>               # Investigar
/sdd-propose <change>              # Crear proposal
/sdd-spec <change>                 # Escribir specs
/sdd-design <change>               # Diseño técnico
/sdd-tasks <change>                # Task breakdown
/sdd-apply <change>                # Implementar
/sdd-verify <change>               # Verificar
/sdd-archive <change>              # Archivar
```

## Stack

| Tecnología | Versión |
|------------|--------|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Prisma | 7.7.0 |
| Zod | 4.3.6 |
| Zustand | 5.0.11 |
| better-auth | 1.5.4 |
| shadcn | 4.2.0 |

## Agent Setup

Este proyecto usa **opencode** con skills especializados en `~/.config/opencode/skills/`.

### Skills del Proyecto

| Área | Skill | Path |
|------|-------|------|
| React 19 + Compiler | react-19 | `~/skills/react-19/SKILL.md` |
| Next.js App Router | nextjs-best-practices | `~/skills/nextjs-best-practices/SKILL.md` |
| TypeScript strict | typescript | `~/skills/typescript/SKILL.md` |
| Tailwind CSS v4 | tailwind-design-system | `~/skills/tailwind-design-system/SKILL.md` |
| Prisma ORM | prisma | `~/skills/prisma/SKILL.md` |
| PostgreSQL setup | prisma-database-setup | `~/skills/prisma-database-setup/SKILL.md` |
| Zod validation | zod-4 | `~/skills/zod-4/SKILL.md` |
| Zustand state | zustand-5 | `~/skills/zustand-5/SKILL.md` |
| React Hook Form | react-hook-form | `~/skills/react-hook-form/SKILL.md` |
| shadcn/ui | shadcn | `~/skills/shadcn/SKILL.md` |
| Auth (Better Auth) | better-auth-best-practices | `~/skills/better-auth-best-practices/SKILL.md` |
| Server-side auth | nextjs-auth-server-side | `~/skills/nextjs-auth-server-side/SKILL.md` |
| Username/DNI login | better-auth-username | `~/skills/better-auth-username/SKILL.md` |
| PostgreSQL best practices | postgresql-best-practices | `~/skills/postgresql-best-practices/SKILL.md` |
| API testing | api-testing-patterns | `~/skills/api-testing-patterns/SKILL.md` |
| Frontend design | frontend-design | `~/skills/frontend-design/SKILL.md` |
| README versioning | readme-guardian | `~/skills/readme-guardian/SKILL.md` |
| Testing/debugging | testing-debugging | `~/skills/testing-debugging/SKILL.md` |

### Instalación

1. Asegurate de tener **opencode** instalado
2. Los skills van en `~/.config/opencode/skills/`
3. Usar el skill `find-skills` para buscar e instalar skills
4. O clonar/linkear manualmente desde el origen de cada skill

### Verificación

El agente lee automáticamente los skills desde `AGENTS.md` cuando detecta el contexto соответствующий.

## Código

- Function components únicamente
- Server Components por defecto; Client Components con `"use client"`
- Mensajes de error en español
- TypeScript strict mode
- No `console.log` en producción
- Siempre error handling

## UI Components

Usar **shadcn/ui** para componentes base. No crear custom para:
- Button, Input, Select, Dialog, Dropdown, Card

Agregar: `npx shadcn@latest add <componente>`

## Testing

```bash
npm run test          # Playwright E2E
npm run test:ui       # Playwright con UI
npm run test:unit     # Vitest unit tests
npm run test:unit:watch # Vitest watch mode
```

## DB

```bash
npx prisma generate   # Generar Prisma client
npx prisma db push    # Push schema
npm run db:seed       # Seed data
npx prisma studio      # Prisma Studio
```

## Pull Requests

- Título descriptivo siguiendo conventional commits
- Descripción del qué y por qué
- Link a issue si aplica
- Screenshots para cambios de UI

## Memorias (Engram)

Este proyecto usa **Engram** para memoria persistente entre sesiones:

- `mem_save` — Guardar decisiones, bugs fixed, patterns establecidos
- `mem_search` — Buscar decisiones pasadas
- `mem_session_summary` — Resumen al cerrar sesión

Ver `AGENTS.md` para el protocolo completo.
