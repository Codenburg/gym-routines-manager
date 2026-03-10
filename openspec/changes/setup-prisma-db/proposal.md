# Proposal: Setup Prisma 7 + PostgreSQL

## Intent

Configurar la capa de datos del proyecto gym-routines-manager con Prisma 7 y PostgreSQL en Docker local. Este setup es la base para toda la funcionalidad del sistema (CRUD de rutinas, días y ejercicios).

## Scope

### In Scope
- Instalar dependencias de Prisma 7 con adapter de PostgreSQL
- Crear schema.prisma con modelos Rutina, Día, Ejercicio
- Configurar Docker Compose con PostgreSQL
- Crear lib/prisma.ts con singleton pattern
- Actualizar build script para incluir prisma generate
- Ejecutar migrations y verificar conexión

### Out of Scope
- Seed de datos inicial (se hará en otro change)
- UI del panel admin
- Rutas API

## Approach

1. Instalar Prisma 7 y dependencias (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
2. Crear docker-compose.yml con PostgreSQL 16
3. Definir schema.prisma basado en PRD
4. Crear lib/prisma.ts con singleton pattern
5. Actualizar package.json build script
6. Ejecutar `docker compose up -d` y `npx prisma migrate dev`
7. Verificar conexión con script de test

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Agregar dependencias Prisma + actualizar build script |
| `docker-compose.yml` | New | Contenedor PostgreSQL |
| `prisma/schema.prisma` | New | Modelos de datos |
| `lib/prisma.ts` | New | Singleton del cliente Prisma |
| `.env` | Modified | DATABASE_URL |
| `.gitignore` | Modified | Ignorar generated/ |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Prisma 7 breaking changes | Medium | Seguirexploración de documentación, usar adapter correcto |
| Docker no inicia | Low | Verificar Docker Desktop running |
| Connection leaks | Low | Usar singleton pattern obligatoriamente |

## Rollback Plan

1. Eliminar container Docker: `docker compose down`
2. Desinstalar dependencias: `npm uninstall prisma @prisma/client @prisma/adapter-pg pg`
3. Eliminar archivos: `prisma/`, `lib/prisma.ts`
4. Revertir package.json y .env
5. Ejecutar `git checkout .` para restaurar estado

## Dependencies

- Docker Desktop instalado y corriendo
- Node.js 18+

## Success Criteria

- [ ] `docker compose up -d` levanta PostgreSQL sin errores
- [ ] `npx prisma migrate dev` crea las tablas correctamente
- [ ] `npx prisma studio` conecta a la base de datos
- [ ] `npm run build` incluye prisma generate y compila sin errores
- [ ] Script de test conecta a DB y ejecuta query simple
