# Guía de Contribución

## ⚠️ Reglas Críticas
**Dependencias**
- Este proyecto usa el configurador de ecosistemas [Gentleman AI](https://github.com/Gentleman-Programming/gentle-ai). **Es obligatorio usarlo para mantener consistencia en convenciones, código y documentación.**


**GIT:**
- **NEVER** ejecutar `git reset` (hard, soft, mixed) sin permiso explícito del usuario
- **NEVER** ejecutar `git rebase` interactivo sin permiso explícito
- Antes de cualquier operación destructiva, **STOP y PREGUNTAR**

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

# Pre-commit hook para validar convenciones:
Inicair GGA para validar convenciones y código antes de cada commit:
No funciona con powershell o cmd. Usar WSL o Git Bash.

**Recomienndo usar Git Bash desde la terminnal de VSCode para evitar problemas con el hook.**
```bash
gga install             # Install git hook
# Edit .gga to set your PROVIDER
# Create AGENTS.md with your coding standards
# Done — every commit gets reviewed 🎉
```
Para mas informacion sobre GGA: ver [GGA Documentation](https://github.com/Gentleman-Programming/gentleman-guardian-angel)

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
