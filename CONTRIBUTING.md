# Guía de Contribución

## ⚠️ Reglas Críticas
**Dependencias**
- Este proyecto usa el configurador de ecosistemas [Gentleman AI](https://github.com/Gentleman-Programming/gentle-ai). **Es obligatorio usarlo para mantener consistencia en convenciones, código y documentación.**

**Code Review — REJECT si:**
- Secrets/credentials hardcoded
- `console.log` en código de producción
- Error handling faltante
- Antes de cualquier operación destructiva, STOP y PREGUNTAR
- Iniciar GGA precommit hook para validar convenciones y de codigo

## Workflow

1. Crear branch desde `dev`: `git checkout -b feature/nombre`
2. Trabajar en la feature
3. Commitear con conventional commits: `git commit -m "feat: description"`
4. Push: `git push -u origin feature/nombre`
5. Crear PR a `dev`
6. Code review
7. Merge

## Commits

Usar Conventional Commits:

| Tipo | Uso |
|------|-----|
| `feat:` | nueva funcionalidad |
| `fix:` | bug fix |
| `docs:` | documentación |
| `style:` | formatting (sin cambio de código) |
| `refactor:` | refactor |
| `test:` | tests |
| `chore:` | mantenimiento |

## Pre-commit hook (GGA — diff-only review)

> **v0.20.1+**: Este repo usa un wrapper local (`scripts/gga-pre-commit.mjs`) en vez de `gga install`. El wrapper filtra las findings de GGA a las **líneas que cambiaste**, con un escape hatch `.gga-ignore` para issues pre-existentes. Target: GGA v2.8.1.

### Instalación / Desinstalación / Kill switch

```bash
bash scripts/install-gga-hook.sh         # Install (idempotente)
bash scripts/uninstall-gga-hook.sh       # Restore original hook from .bak
GGA_DIFF_FILTER=off git commit -m "..."  # Pass-through (sin filtro diff)
```

No funciona con PowerShell o cmd — usar WSL o Git Bash (recomendado desde la terminal de VSCode).

### Sintaxis de `.gga-ignore`

Una entrada por línea (`#` comentarios, líneas en blanco se ignoran). Glob con `*` (un segmento) y `**` (cualquier path); `?` y `[abc]` no soportados.

| Sintaxis | Significado |
|----------|-------------|
| `path/to/file.ts` | Ignora el archivo completo |
| `path/to/file.ts:42` | Ignora la línea 42 (1-indexed) |
| `path/to/file.ts:42-50` | Ignora el rango inclusivo |

### Agregar una entrada

1. Editar `.gga-ignore` con formato `path:line` (o `path:start-end` para rango).
2. Commitear con un mensaje que explique el por qué.
3. Re-evaluar en cada release menor — las pre-existentes pueden dejar de ser necesarias.

Para más información sobre GGA: ver [GGA Documentation](https://github.com/Gentleman-Programming/gentleman-guardian-angel).

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
| Next.js | 16.2.9 |
| React | 19.2.7 |
| TypeScript | 6 |
| Tailwind CSS | 4 |
| Prisma | 7.8.0 |
| Zod | 4.4.3 |
| Zustand | 5.0.14 |
| better-auth | 1.6.20 |
| shadcn | 4.11.0 |
| pnpm | 11.2.2 |

## Git: `safecommit` alias (workaround for `invalid object 100644` errors)

Este proyecto tiene un issue intermitente de git index corruption en ciertos paths (notablemente `.engram/chunks/*.jsonl.gz` y `openspec/changes/*/*.md`) que se manifiesta con:

```
error: invalid object 100644 <hash> for '<path>'
```

El `git fsck` reporta clean, los objetos SÍ existen en el database, y `git cat-file -e <hash>` retorna exit 0. El root cause exacto no fue identificado definitivamente — el issue aparece solo después de múltiples ciclos de stage+revert+commit.

**Workaround efectivo**: refrescar el index entry de cada archivo staged antes de commitear:

```bash
for f in $(git diff --cached --name-only); do
  git rm --cached -- "$f" 2>/dev/null
  git add -- "$f" 2>/dev/null
done
git commit -m "..."
```

**Setup (1 vez por dev)** — definir un alias:

```bash
git config --local alias.safecommit '!f() {
  for f in $(git diff --cached --name-only); do
    git rm --cached -- "$f" 2>/dev/null
    git add -- "$f" 2>/dev/null
  done
  git commit "$@"
}; f'
```

Luego usar `git safecommit -m "..."` en vez de `git commit -m "..."` cuando el commit regular falle con "invalid object".

**Estado**: workaround en uso durante todo el 1.0 prep. Root cause open (no bloquea 1.0, post-1.0 tech debt).

## Agent Setup

Este proyecto usa **opencode** con skills especializados en `~/.config/opencode/skills/`.

## Código

- Function components únicamente
- Server Components por defecto; Client Components con "use client"
- TypeScript strict mode
- No console.log en producción
- Siempre error handling
- Mensajes de error en español


### Skills del Proyecto


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

Agregar: `pnpm dlx shadcn@latest add <componente>`

## Testing

```bash
pnpm run test          # Playwright E2E
pnpm run test:ui       # Playwright con UI
pnpm run test:unit     # Vitest unit tests
pnpm run test:unit:watch # Vitest watch mode
```

## DB

Primero, levantar PostgreSQL:

```bash
docker compose up -d        # Iniciar PostgreSQL en background
```

Luego, aplicar esquema y datos:

```bash
pnpm dlx prisma generate   # Generar Prisma client
pnpm dlx prisma db push    # Push schema
pnpm run db:seed           # Seed data
pnpm dlx prisma studio     # Prisma Studio
```

### Workflow de migraciones (no estándar)

Este proyecto **usa `prisma db push` en vez de `prisma migrate dev`** por shadow database issues (Postgres + docker compose no expone una shadow DB limpia, así que `migrate dev` falla con "drift detected"). Es un trade-off conocido y documentado en el ROADMAP (`GGA-FOLLOWUP-7`).

**Para un cambio de schema local**:

1. Editar `prisma/schema.prisma`
2. `pnpm dlx prisma db push` — pushea el schema al Postgres local
3. (Opcional) `pnpm dlx prisma migrate dev --name <name> --create-only` — genera la migration SQL **sin aplicarla** (porque el shadow DB check va a fallar)
4. `pnpm dlx prisma migrate resolve --applied <migration-name>` — marca la migration como aplicada sin ejecutarla (la SQL ya está aplicada vía `db push`)
5. Commit el archivo `prisma/migrations/<timestamp>_<name>/migration.sql` con el código

**Cuándo NO usar `db push`**:

- En CI/staging/production: ahí `db push` puede borrar columnas si el schema local está más nuevo. Usar `prisma migrate deploy` con las migrations committed.
- Cuando el cambio es destructivo (drop column, rename): commit la migration SQL manualmente y aplicar con `prisma migrate deploy` o `psql` directo.

**Estado actual**: 2 migrations committed en `prisma/migrations/` (ver `ls prisma/migrations/`). El schema actual del repo y la DB local están en sync per `db push` (a la fecha del último `db push` local).

```bash
docker compose down
```

## Memorias (Engram)

Este proyecto usa Engram para memoria persistente:

Guardar insights importantes para evitar repetir discusiones y mantener un historial de decisiones técnicas.
subirlas al repositorio para que todos puedan acceder a ellas.
```bash
engram sync --import  # importar nuevos fragmentos
engram sync # Exportar nuevas memorias como fragmento comprimido
```
**Primero ejecutar `engram sync --import` para traer nuevas memorias al proyecto, luego `engram sync` para exportar cualquier nueva memoria creada durante el desarrollo.**

Para más información sobre Engram: ver [Engram Documentation](https://github.com/Gentleman-Programming/engram#quick-start)

## Pull Requests

- Título descriptivo siguiendo conventional commits
- Descripción del qué y por qué
- Link a issue si aplica
- Screenshots para cambios de UI

Ver `AGENTS.md` para el protocolo completo.
