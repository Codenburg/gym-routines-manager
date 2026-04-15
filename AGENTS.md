## ⚠️ CRITICAL RULES — IGNORING THESE IS UNACCEPTABLE

### GIT RULES
- **NEVER run `git reset` (hard, soft, mixed) without explicit user permission.**
- **NEVER run interactive `git rebase` without explicit user permission.**
- **Before any destructive git operation, STOP and ASK.**

### Skills
When working with React, read `~/skills/react-19/SKILL.md` first.
When working with Next.js, read `~/skills/nextjs-best-practices/SKILL.md` first.
When working with TypeScript, read `~/skills/typescript/SKILL.md` first.
When working with Tailwind CSS, read `~/skills/tailwind-design-system/SKILL.md` first.
When working with Prisma, read `~/skills/prisma/SKILL.md` first.
When Set-up Prisma with ProstgreSQL, Nodejs and Typescript, read `~/skills/prisma-database-setup/SKILL.md` first.
When working with zod-4v, read `~/skills/zod-4/SKILL.md` first.
When Working with zustand-5v, read `~/skills/zustand-5/SKILL.md` first.
When Working on frontend design, read `~/skills/frontend-design/SKILL.md` first.

When working with authentication, read `~/skills/better-auth-best-practices/SKILL.md` first.
When implementing server-side auth with Next.js App Router (flicker-free), read /skills/nextjs-auth-server-side/SKILL.md` first.
When working with username/DNI login, read `~/skills/better-auth-username/SKILL.md` first.
When Working with Forms, read `~/skills/react-hook-form/SKILL.md` first.
When Working with Shadcn UI, read `~/skills/shadcn/SKILL.md` first.
When maintaining README as single source of truth with versioning after commits, read /skills/readme-guardian/SKILL.md` first.
For testing and debugging, read `~/skills/testing-debugging/SKILL.md` first.



## Not installed:
When working with Frontend design, read `~/skills/frontend-design/SKILL.md` first.
When workinkg with postgreSQL, read `~/skills/postgresql-best-practices/SKILL.md` first.
When writting API, read  `~/skills/api-testing-patterns/SKILL.md` first.
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