## ⚠️ CRITICAL RULES — IGNORING THESE IS UNACCEPTABLE

### GIT RULES
- **NEVER run `git reset` (hard, soft, mixed) without explicit user permission.**
- **NEVER run interactive `git rebase` without explicit user permission.**
- Before any destructive git operation, STOP and ASK.

### Skills
When working with React, read `~/.agents/skills/react-19/SKILL.md` first.
When working with Next.js, read `~/.agents/skills/nextjs-best-practices/SKILL.md` first.
When working with TypeScript, read `~/.agents/skills/typescript/SKILL.md` first.
When working with Tailwind CSS, read `~/.agents/skills/tailwind-design-system/SKILL.md` first.
When working with Prisma, read `~/.agents/skills/prisma/SKILL.md` first.
When working with zod, read `~/.agents/skills/zod-4/SKILL.md` first.
When Working with zustand, read `~/.agents/skills/zustand-5/SKILL.md` first.
When working with Frontend design, read `~/.agents/skills/frontend-design/SKILL.md` first.
When workinkg with postgreSQL, read `~/.agents/skills/postgresql-best-practices/SKILL.md` first.
When writting API, read  `~/.agents/skills/api-testing-patterns/SKILL.md` first.
When working with authentication, read `~/.agents/skills/better-auth-best-practices/SKILL.md` first.
When implementing server-side auth with Next.js App Router (flicker-free), read `.agents/skills/nextjs-auth-server-side/SKILL.md` first.
When working with username/DNI login, read `~/.agents/skills/better-auth-username/SKILL.md` first.
When Working with Forms, read `~/.agents/skills/react-hook-form/SKILL.md` first.
When Workin with Shadcn UI, read `~/.agents/skills/shadcn/SKILL.md` first.
When implementing URL-based search with debounce and dual-state pattern, read `.agents/skills/url-search-debounce/SKILL.md` first.
When maintaining README as single source of truth with versioning after commits, read `.agents/skills/readme-guardian/SKILL.md` first.
For config and rules related to project management,rules, logics and more, read `~/openspec/config.yaml` first.
For testing and debugging, read `~/.agents/skills/testing-debugging/SKILL.md` first.

# Code Review Rules

## References

- project rules: `~/openspec/config.yaml`
- 
---

## Critical Rules (ALL files)

REJECT if:

- Hardcoded secrets/credentials
- `console.log` in production code
- Missing error handling