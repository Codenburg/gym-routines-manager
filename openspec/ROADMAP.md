# Roadmap

_Last updated: 2026-04-13_ | _Version: 0.8.0_

---

## ✅ Completado

### Funcionalidades
- [x] Exploración de rutinas por nombre y tipo
- [x] Visualización detallada de rutinas con días y ejercicios
- [x] Login administrador con DNI (Better Auth)
- [x] CRUD completo de rutinas, días y ejercicios
- [x] Ordenamiento drag-and-drop de ejercicios (@dnd-kit)
- [x] Duplicado de rutinas
- [x] Edición de precio de inscripción
- [x] Gestión de feriados (días no laborables)
- [x] Tema claro/oscuro con persistencia
- [x] Notificación badge de feriados nuevos
- [x] Horarios parciales en feriados (hora_inicio, hora_fin)
- [x] Prevención de feriados duplicados (unique date constraint)
- [x] Página de información del gimnasio
- [x] Búsqueda unificada con debounce y URL como source of truth
- [x] Promociones y descuentos por duración (v0.6.0)
- [x] Admin CRUD para promociones y descuentos (v0.6.0)
- [x] Sidebar admin con navegación y drawer mobile (v0.7.0)
- [x] Sidebar footer con user dropdown, theme toggle y logout (v0.8.0)

### Técnico
- [x] Next.js 16.1.6 + React 19.2.3
- [x] TypeScript strict mode
- [x] Tailwind CSS v4 + shadcn/ui
- [x] Zustand para estado global (theme)
- [x] Zod v4 + React Hook Form para validación
- [x] Prisma ORM con PostgreSQL 18.3
- [x] Server Actions para mutaciones
- [x] Cache invalidation con revalidatePath/revalidateTag
- [x] unstable_cache para rutinas
- [x] Ownership audit trail en base de datos
- [x] User soft delete
- [x] Unit tests con Vitest
- [x] E2E tests con Playwright

### Documentación
- [x] README.md actualizado
- [x] PRD.md con roadmap y fases
- [x] Specs en openspec/

---

## ⏳ Pendiente

### Alta Prioridad
- [ ] Tests E2E con cobertura completa (Playwright) — Fase 4
- [ ] Documentación de API (MDX-based)

### Media Prioridad
- [ ] Generación de PDF por rutina (@react-pdf/renderer)
- [ ] Cache warming cron para SEO

### Baja Prioridad
- [ ] Exportación CSV de rutinas
- [ ] i18n (multi-idioma)
- [ ] PWA support (offline PDF access)
- [ ] Multi-gym support

### Deferred (baja traffic actual)
- [ ] Optimización de rendimiento avanzada (lazy loading, code splitting)
