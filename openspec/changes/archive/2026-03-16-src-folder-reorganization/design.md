# Design: Src Folder Reorganization

## Technical Approach

Migrar las carpetas `app`, `components`, `lib`, `store` de la raíz a `src/` Actualizando el path alias `@/` en tsconfig.json de `"./*"` a `"./src/*"`. Esta migración es transparente porque todos los imports usan el path alias `@/`, no paths relativos.

## Architecture Decisions

### Decision: Orden de migración de carpetas

**Choice**: Mover carpetas en orden: `lib/`, `store/`, `components/`, `app/`

**Alternatives considered**: Mover todas simultáneamente o en orden aleatorio

**Rationale**: 
- `lib/` y `store/` son dependencias base con menos dependientes
- `components/` depende de `lib/` y `store/`
- `app/` es el entry point y depende de todos los anteriores
- Este orden permite verificar incrementally que las dependencias se resuelven correctamente

### Decision: Estrategia de actualización de tsconfig.json

**Choice**: Actualizar paths ANTES de mover carpetas

**Alternatives considered**: Actualizar después del move, o hacer ambos simultáneamente

**Rationale**: 
- Next.js auto-resuelve `src/app` como el directorio de rutas
- Actualizar el path alias primero permite que TypeScript resuelva correctamente durante el proceso
- Si se hace después, podría haber un momento donde los imports no resuelvan

### Decision: Limpieza de cache post-migración

**Choice**: Eliminar `.next/` completamente con `rm -rf .next`

**Alternatives considered**: Solo limpiar parcialmente o confiar en rebuild automático

**Rationale**:
- La migración cambia rutas de módulos a nivel interno
- Next.js puede cachear paths antiguos y causar errores extraños
- Limpieza completa garantiza un estado limpio

## Data Flow

```
ROOT                           SRC/
├── app/  ──────────────────►  src/app/
├── components/ ─────────────►  src/components/
├── lib/    ────────────────►  src/lib/
├── store/  ──────────────────►  src/store/
├── tsconfig.json (paths) ─────► "@/*": ["./src/*"]
```

**Nota**: Los imports en código (`@/lib/auth`, `@/components/ui/button`, etc.) NO cambian - solo el path resolution en tsconfig.json.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `tsconfig.json` | Modify | Actualizar `"@/*": ["./src/*"` |
| `src/` (new dir) | Create | Crear directorio src si no existe |
| `app/` | Move → `src/app/` | Directorio de rutas Next.js |
| `components/` | Move → `src/components/` | Componentes React |
| `lib/` | Move → `src/lib/` | Utilidades y configuración |
| `store/` | Move → `src/store/` | Stores Zustand |
| `.next/` | Delete | Limpiar cache de compilación |

### Archivos quepermanecen en raíz:

- `tsconfig.json` (actualizado)
- `next.config.ts`
- `middleware.ts`
- `package.json`
- `playwright.config.ts`
- `prisma.config.ts`
- `prisma/`
- `public/`

## Interfaces / Contracts

No hay cambios en interfaces. El path alias es un mapping de resolución de módulos:

```typescript
// tsconfig.json - ANTES
"paths": {
  "@/*": ["./*"]
}

// tsconfig.json - DESPUÉS  
"paths": {
  "@/*": ["./src/*"]
}
```

Esto mapea:
- `@/lib/auth` → `./src/lib/auth`
- `@/components/ui/button` → `./src/components/ui/button`
- `@/store/theme-store` → `./src/store/theme-store`
- `@/app/actions/rutinas` → `./src/app/actions/rutinas`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| TypeScript | Path resolution | `npx tsc --noEmit` |
| Build | Compilación completa | `npm run build` |
| Dev Server | Servidor levanta | `npm run dev` (verificar puerto 3000) |
| E2E | Rutas principales | Navegar: /, /admin, /admin/login, /rutinas/[id], /feriados |

### Verificaciones específicas:

1. **S1: Build**
   - `npm run build` completa sin errores
   - No hay warnings de TypeScript sobre paths

2. **S2: Dev Server**
   - `npm run dev` levanta en puerto 3000
   - No hay errores de resolución de módulos

3. **S3: Rutas**
   - `/` - Homepage carga
   - `/admin` - Dashboard admin carga
   - `/admin/login` - Login page carga
   - `/rutinas/[id]` - Detail page carga
   - `/feriados` - Feriados page carga

4. **S4: Imports**
   - `import { authClient } from "@/lib/auth-client"` → `src/lib/auth-client.ts`
   - `import { useThemeStore } from "@/store/theme-store"` → `src/store/theme-store.ts`
   - `import ThemeToggle from "@/components/theme-toggle"` → `src/components/theme-toggle.tsx`

## Migration / Rollout

**No hay migración de datos requerida**. Este es un cambio puramente de estructura de archivos.

### Steps de ejecución:

1. **Pre-check**: Verificar que `src/` no existe o está vacío
2. **Actualizar tsconfig.json**: Cambiar paths de `"@/*": ["./*"]` a `"@/*": ["./src/*"]`
3. **Mover carpetas** (en orden):
   - `mv lib/ src/lib/`
   - `mv store/ src/store/`
   - `mv components/ src/components/`
   - `mv app/ src/app/`
4. **Limpiar cache**: `rm -rf .next`
5. **Verificar**:
   - `npx tsc --noEmit`
   - `npm run build`
   - `npm run dev`

### Rollback Plan:

Si algo falla:
1. Revertir tsconfig.json paths a `"@/*": ["./*"]`
2. Mover carpetas de vuelta: `mv src/lib/ lib/` etc.
3. Limpiar .next y reintentar

## Open Questions

- [ ] Ninguno - la migración es straightforward

## Risks

| Risk | Mitigation |
|------|------------|
| Cache de Next.js cause errores | Limpiar `.next/` completamente |
| Imports relativos rompan | No hay paths relativos en el codebase (99+ usan `@/`) |
| Archivos perdidos en el move | Verificar conteo de archivos antes/después |

## Affected Files Count

- **Moves**: 4 carpetas (`app/`, `components/`, `lib/`, `store/`)
- **Modify**: 1 archivo (`tsconfig.json`)
- **Delete**: 1 carpeta (`.next/` - cache)
- **Total archivos a mover**: ~60+ archivos TypeScript/TSX
