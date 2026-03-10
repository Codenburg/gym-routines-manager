# Proposal: Homepage UI - MVP

## Intent

Implementar la homepage de la aplicación de gestión de rutinas de gym que muestre el listado de rutinas disponibles con funcionalidad de búsqueda básica. Este es el primer paso para tener una interfaz funcional después del boilerplate inicial de Next.js.

**Problema resuelto**: El usuario tiene un proyecto Next.js con Prisma/PostgreSQL pero la UI es solo el boilerplate por defecto. Necesita una homepage que presente las rutinas de forma atractiva y funcional.

## Scope

### In Scope
- Listado de rutinas (cards con información básica: nombre, descripción, número de días)
- Campo de búsqueda para filtrar rutinas por nombre
- API route para obtener rutinas con filtro de búsqueda
- Componente de RoutineCard reutilizable
- Loading state con skeleton usando Suspense
- Diseño responsive (mobile-first)

### Out of Scope
- Detalle de rutina (página individual)
- Crear/editar rutinas
- Autenticación de usuarios
- Filtering avanzado (por dificultad, duración, etc.)
- Modo oscuro (se implementará en change separado)

## Approach

### Stack Tecnológico
- **Next.js 15 App Router**: Server Components por defecto, layouts anidados, streaming con Suspense
- **React 19**: Usar `use()` hook para consumir promises directamente en Server Components, `useFormStatus` para estados de form
- **Tailwind CSS 4**: Estilos utility-first con variables CSS para theming

### Arquitectura de Componentes
```
app/
├── page.tsx                    # Server Component - homepage
├── layout.tsx                  # Root layout
├── loading.tsx                 # Suspense fallback
└── api/
    └── rutinas/
        └── route.ts            # API route para listado + búsqueda

components/
├── ui/                         # Componentes atómicos (Button, Input, Card)
├── routines/
│   ├── RoutineList.tsx         # Lista de rutinas
│   └── RoutineCard.tsx         # Card individual
└── search/
    └── SearchBar.tsx           # Barra de búsqueda
```

### Patrones a Implementar
1. **Server Components**: Fetch de datos directamente en el componente, sin useEffect
2. **Streaming**: Usar `<Suspense>` con skeleton para loading states
3. **use() hook**: Consumir promises async dentro de Server Components
4. **Form Actions**: Búsqueda via URL params (GET request), no mutations
5. **Atomic Design**: Separar componentes UI puros de componentes de negocio

### Diseño UI
- **Estética**: Limpia, moderna, enfoque en contenido
- **Colores**: Primary brand (azul/verde fitness), backgrounds neutros
- **Tipografía**: Sans-serif legible, jerarquía clara
- **Cards**: Bordes redondeados, shadow sutil, hover states
- **Responsive**: Grid de 1 columna mobile, 2 tablet, 3 desktop

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/page.tsx` | Modified | Reemplazar boilerplate con homepage real |
| `app/api/rutinas/route.ts` | New | Endpoint para GET rutinas con query search |
| `components/ui/` | New | Componentes atómicos base (Card, Input) |
| `components/routines/` | New | RoutineCard y RoutineList |
| `components/search/SearchBar.tsx` | New | Componente de búsqueda |
| `app/loading.tsx` | New | Suspense skeleton para la homepage |
| `prisma/schema.prisma` | Reviewed | Verificar modelo Rutina existe |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Prisma schema no tiene modelo Rutina | Medium | Verificar schema antes de implementar API |
| Datos de prueba no existen | High | Crear seed script con rutinas de ejemplo |
| UI no cumple expectativas estéticas | Low | Seguir principios de atomic design, mantener simple |
| Performance con muchos registros | Low | Implementar paginación si es necesario (futuro) |

## Rollback Plan

1. Eliminar `components/routines/`, `components/search/`, `components/ui/`
2. Restaurar `app/page.tsx` con código original de Next.js
3. Eliminar `app/api/rutinas/route.ts`
4. Eliminar `app/loading.tsx` si se creó
5. Ejecutar `git checkout -- .` para restaurar estado limpio

## Dependencies

- **Prisma**: Schema debe tener modelo `Rutina` con campos: id, nombre, descripcion, dias (relation to Dia)
- **Tailwind CSS 4**: Configuración existente en el proyecto
- **Base de datos**: PostgreSQL con datos de prueba (seed)

## Success Criteria

- [ ] La homepage muestra listado de rutinas desde la base de datos
- [ ] La búsqueda filtra rutinas por nombre en tiempo real (o al submit)
- [ ] Loading statean datos
- muestra skeleton mientras carg [ ] Diseño es responsive (funciona en mobile y desktop)
- [ ] API route retorna JSON con rutinas y soporta query param `?search=`
- [ ] No hay errores en consola ni en terminal durante build/dev
