# Tasks: Src Folder Reorganization

## Phase 1: Preparación

- [ ] 1.1 Verificar que el directorio `src/` no existe o está vacío en la raíz del proyecto
- [ ] 1.2 Realizar backup del estado actual (git status para verificar archivos sin commit)
- [ ] 1.3 Verificar que todos los imports usan el path alias `@/` (no paths relativos)

## Phase 2: Actualizar configuración TypeScript

- [ ] 2.1 Actualizar `tsconfig.json` - cambiar `"@/*": ["./*"]` a `"@/*": ["./src/*"]`

## Phase 3: Migración de carpetas

- [ ] 3.1 Mover `lib/` a `src/lib/`
- [ ] 3.2 Mover `store/` a `src/store/`
- [ ] 3.3 Mover `components/` a `src/components/`
- [ ] 3.4 Mover `app/` a `src/app/`

## Phase 4: Limpieza de cache

- [ ] 4.1 Eliminar directorio `.next/` completamente (`rm -rf .next`)

## Phase 5: Verificación

- [ ] 5.1 Ejecutar `npx tsc --noEmit` para verificar resolución de paths
- [ ] 5.2 Ejecutar `npm run build` para verificar compilación completa
- [ ] 5.3 Ejecutar `npm run dev` y verificar que el servidor levanta en puerto 3000
- [ ] 5.4 Verificar que la ruta `/` carga correctamente
- [ ] 5.5 Verificar que la ruta `/admin` carga correctamente
- [ ] 5.6 Verificar que la ruta `/admin/login` carga correctamente
- [ ] 5.7 Verificar que la ruta `/rutinas/[id]` carga correctamente
- [ ] 5.8 Verificar que la ruta `/feriados` carga correctamente

## Phase 6: Rollback (solo si falla)

- [ ] 6.1 Revertir `tsconfig.json` paths a `"@/*": ["./*"]`
- [ ] 6.2 Mover carpetas de vuelta: `src/lib/ → lib/`, `src/store/ → store/`, etc.
- [ ] 6.3 Limpiar `.next/` y reintentar
