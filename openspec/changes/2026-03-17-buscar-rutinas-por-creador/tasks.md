# Tasks: Buscar rutinas por creador

## Phase 1: Backend API

- [x] 1.1 Modificar `src/app/api/rutinas/route.ts` - agregar parámetro `searchBy` al GET handler
- [x] 1.2 Modificar el where clause para filtrar por `creador` cuando searchBy="creador"
- [x] 1.3 Mantener backward compatibility - por defecto buscar por `nombre`
- [x] 1.4 Verificar que el campo `creador` se retorna en la respuesta

## Phase 2: Frontend UI

- [x] 2.1 Agregar componente Select de shadcn/ui al SearchBar (ejecutar `npx shadcn@latest add select`)
- [x] 2.2 Modificar `src/components/search/search-bar.tsx` para aceptar prop `defaultSearchBy`
- [x] 2.3 Agregar estado local para el search type seleccionado
- [x] 2.4 Modificar createQueryString para incluir searchBy en la URL
- [x] 2.5 Mantener "Nombre" como valor por defecto
- [x] 2.6 Persistir el search type en la URL para mantener consistencia

## Phase 3: Verification

- [ ] 3.1 Test manual: GET /api/rutinas?search=Marcelo&searchBy=creador retorna rutinas filtradas por creador
- [ ] 3.2 Test manual: GET /api/rutinas?search=Pecho retorna rutinas filtradas por nombre (backward compatible)
- [ ] 3.3 Test manual: UI dropdown cambia el query param correctamente
- [ ] 3.4 Verificar que no hay errores de TypeScript

## Phase 4: Cleanup

- [ ] 4.1 Verificar que el código sigue las convenciones del proyecto
- [ ] 4.2 Revisar que los mensajes de error en el API siguen siendo apropiados
