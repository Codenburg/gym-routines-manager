# Src Folder Reorganization - Spec

## Overview

Migrar las carpetas `app`, `components`, `lib`, `store` de la raíz a una carpeta `src/` para mejorar la organización del proyecto y seguir las mejores prácticas de Next.js.

## Context

- **Stack**: Next.js 16.1.6 con App Router
- **Estado actual**: Carpetas en raíz: `app/`, `components/`, `lib/`, `store/`
- **Path alias actual**: `"@/*": ["./*"]` en tsconfig.json
- **Usos de `@/`**: 99+ en todo el código fuente
- **Stack técnico**: React 19, Zustand 5, better-auth, Prisma, Tailwind CSS 4, Zod 4

## Requirements

### R1: Actualización de tsconfig.json
- El path alias `@/*` debe cambiar de `"./*"` a `"./src/*"`
- Después del cambio: `"@/*": ["./src/*"]`

### R2: Reorganización de carpetas
- Mover `app/` → `src/app/`
- Mover `components/` → `src/components/`
- Mover `lib/` → `src/lib/`
- Mover `store/` → `src/store/`
- La carpeta `src/` existe y está vacía (pre-creada)

### R3: Compatibilidad de imports
- Todos los imports existentes con `@/` deben seguir funcionando sin cambios
- Los imports relativos deben actualizarse si corresponde

### R4: Archivos de configuración raía
- Los siguientes archivos deben permanecer en raíz:
  - `tsconfig.json` (actualizado)
  - `next.config.ts`
  - `middleware.ts`
  - `package.json`
  - `playwright.config.ts`
  - `prisma.config.ts`

## Scenarios

### S1: Verificación de build
1. Ejecutar `npm run build`
2. Verificar que la compilación completa sin errores
3. Confirmar que no hay warnings de TypeScript relacionados con paths

### S2: Verificación de dev server
1. Ejecutar `npm run dev`
2. Verificar que el servidor levanta en puerto 3000
3. Confirmar que no hay errores de resolución de módulos

### S3: Verificación de rutas de Next.js
1. Navegar a `/` - Homepage debe cargar
2. Navegar a `/admin` - Dashboard admin debe cargar
3. Navegar a `/admin/login` - Login page debe cargar
4. Navegar a `/rutinas/[id]` - Detail page debe cargar
5. Navegar a `/feriados` - Feriados page debe cargar

### S4: Verificación de imports con @/
- `import { authClient } from "@/lib/auth-client"` debe resolver a `src/lib/auth-client.ts`
- `import { useThemeStore } from "@/store/theme-store"` debe resolver a `src/store/theme-store.ts`
- `import ThemeToggle from "@/components/theme-toggle"` debe resolver a `src/components/theme-toggle.tsx`

## Acceptance Criteria

- [ ] `npm run build` completa sin errores
- [ ] `npm run dev` levanta el servidor exitosamente
- [ ] Todas las rutas de la app funcionan correctamente
- [ ] Todos los imports con `@/` se resuelven correctamente
- [ ] No hay errores de TypeScript relacionados con paths

## Technical Notes

- Next.js con App Router soporta `src/app` nativamente
- El cambio de path alias es transparente si se actualiza tsconfig.json correctamente
- Los archivos .next pueden necesitar limpieza con `rm -rf .next` antes de rebuild
