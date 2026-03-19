# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Sistema Web de Gestión y Visualización de Rutinas de Gimnasio

**Estado del documento:** En producción

---

# ONE PAGER

## Overview

El proyecto consiste en un sistema web diseñado para gestionar y visualizar rutinas de entrenamiento de gimnasio.

Los administradores pueden crear rutinas estructuradas compuestas por días y ejercicios. Los usuarios públicos pueden explorar las rutinas disponibles, visualizar su contenido y descargar una versión en PDF.

El sistema funciona como un gestor de contenido jerárquico enfocado en entrenamiento físico.

---

## Problem

Actualmente no existe un sistema centralizado que permita:

- organizar rutinas de gimnasio de forma estructurada
- visualizar rutinas de forma clara
- compartir rutinas de manera simple
- generar documentos descargables con la rutina completa

Las rutinas suelen compartirse mediante archivos estáticos o mensajes, lo que genera problemas:

- difícil actualización del contenido
- falta de estructura
- dificultad para compartir
- poca accesibilidad para los usuarios

---

## Objectives

1. Permitir la visualización pública de rutinas de entrenamiento.
2. Facilitar la creación y gestión de rutinas por parte de administradores.
3. Permitir la descarga de rutinas en formato PDF.
4. Proveer una estructura clara basada en Rutina → Día → Ejercicio.

---

## Constraints

1. ~~No se incluye sistema de usuarios registrados.~~ → **IMPLEMENTADO: Better Auth con DNI**
2. No se incluye sistema de pagos (solo precio informativo).
3. No se incluye seguimiento de progreso de entrenamiento.
4. No se contempla aplicación móvil nativa.
5. Solo existe un rol administrador.

---

# Personas

## Usuario Público

Persona interesada en entrenamientos de gimnasio que busca visualizar rutinas estructuradas y descargarlas.

**Objetivos**

- encontrar rutinas fácilmente
- visualizar ejercicios organizados
- descargar rutinas para entrenar
- filtrar por tipo de entrenamiento
- filtrar por entrenador

---

## Administrador

Persona responsable de gestionar el contenido del sistema.

**Objetivos**

- crear rutinas
- editar contenido
- organizar días de entrenamiento
- definir ejercicios y orden
- duplicar rutinas existentes
- gestionar precio de inscripción
- gestionar feriados

---

# Use Cases

## Escenario 1 — Exploración de rutinas

Un usuario accede al sitio web y visualiza un listado de rutinas disponibles. Utiliza el buscador o filtros para encontrar una rutina específica por nombre, tipo o entrenador.

---

## Escenario 2 — Visualización de rutina

El usuario selecciona una rutina y accede a su página de detalle, donde puede ver los días de entrenamiento y los ejercicios organizados.

---

## Escenario 3 — Descarga de rutina

El usuario descarga la rutina completa en formato PDF para poder utilizarla fuera del sistema.

---

## Escenario 4 — Login administrador

Un administrador accede a `/admin/login`, ingresa su DNI y contraseña, y accede al panel de gestión.

---

## Escenario 5 — Gestión de rutinas

El administrador crea, edita, duplica o elimina rutinas. Puede agregar días y ejercicios, ordenarlos mediante drag-and-drop.

---

# PRD

# Features In

## Visualización pública de rutinas

El sistema muestra un listado accesible de rutinas disponibles para todos los visitantes.

Incluye:

- listado general con cards
- buscador por nombre
- filtros por tipo (fuerza, cardio, flexibilidad, hipertrofia)
- filtros por entrenador/creador
- paginación

---

## Página de detalle de rutina

Cada rutina posee una página dedicada que muestra:

- nombre de la rutina
- descripción
- tipo de entrenamiento
- creador/entrenador
- días de entrenamiento
- ejercicios organizados por día
- botón de descarga PDF

---

## Estructura jerárquica del contenido

El contenido se organiza en tres niveles:

Rutina → Día → Ejercicio

Cada día contiene múltiples ejercicios ordenados por `orden`.

Cada ejercicio tiene `series` y `repes` como metadata.

---

## Generación de PDF

El sistema permite generar automáticamente un documento PDF que reproduce exactamente la estructura de la rutina visible en pantalla.

---

## Panel administrador

Interfaz privada para gestión del contenido.

Permite:

- login con DNI
- crear rutinas (formulario simple o completo con días y ejercicios)
- editar rutinas
- eliminar rutinas
- duplicar rutinas
- crear días
- editar días
- eliminar días
- crear ejercicios
- editar ejercicios
- eliminar ejercicios
- ordenar ejercicios (drag-and-drop)
- editar precio de inscripción del gimnasio
- gestionar feriados (agregar/eliminar fechas no laborables)

---

## Tema claro/oscuro

El sistema soporta切换 entre modo claro y modo oscuro. La preferencia se guarda en localStorage.

---

## Búsqueda avanzada

Los usuarios pueden filtrar rutinas por:

- nombre (texto libre)
- tipo de entrenamiento
- creador/entrenador

---

# Features Out

Las siguientes funcionalidades quedan fuera del alcance del sistema:

- registro de usuarios públicos
- sistema de autenticación para usuarios públicos
- seguimiento de progreso de entrenamiento
- pagos o suscripciones
- múltiples roles de administración
- aplicación móvil nativa
- exportación masiva

---

# Modelo de Datos

## Rutina

Campos:

- id (UUID)
- nombre
- tipo (fuerza | cardio | flexibilidad | hipertrofia)
- descripcion (opcional)
- creador (opcional, nombre del entrenador)
- createdAt
- updatedAt

Relación:

Una rutina contiene múltiples días.

---

## Día

Campos:

- id (UUID)
- rutinaId (FK)
- nombre
- musculosEnfocados (opcional)
- orden (entero, para ordenamiento)
- createdAt
- updatedAt

Relación:

Un día pertenece a una rutina y contiene múltiples ejercicios.

---

## Ejercicio

Campos:

- id (UUID)
- diaId (FK)
- nombre
- series (opcional, ej: "4")
- repes (opcional, ej: "12")
- orden (entero, para ordenamiento)
- createdAt
- updatedAt

Relación:

Un ejercicio pertenece a un día.

---

## Gym (singleton)

Campos:

- id = "gym" (string fijo)
- price (Decimal)
- createdAt
- updatedAt

Relación:

Un gimnasio tiene múltiples feriados.

---

## Feriado

Campos:

- id (UUID)
- fecha (DateTime)
- gymId (FK, default "gym")
- createdAt

Relación:

Un feriado pertenece al gimnasio.

---

## User (Better Auth)

Campos:

- id (UUID)
- name
- dni (único, para login)
- username (único, opcional)
- email (único, opcional)
- emailVerified
- image
- admin (boolean)
- role ("admin" | "user")
- banned
- createdAt
- updatedAt

---

## Relaciones

```
Rutina → múltiples Días
Día → múltiples Ejercicios
Gym → múltiples Feriados
User → múltiples Sessions
User → múltiples Accounts
```

---

# Pantallas del Sistema

## Públicas

- `/` - Home (listado + buscador + filtros por tipo y entrenador)
- `/rutinas/[id]` - Detalle de rutina
- `/rutinas/[id]/dias/[diaId]` - Detalle de día
- `/feriados` - Lista de feriados
- `/informacion` - Página de información del gimnasio

---

## Administrador

- `/admin/login` - Login administrador
- `/admin` - Dashboard (stats + rutinas recientes)
- `/admin/rutinas` - Listado de rutinas (CRUD)
- `/admin/rutinas/new` - Crear rutina
- `/admin/rutinas/[id]` - Editar rutina + gestionar días
- `/admin/rutinas/[id]/dias/[diaId]` - Editar día + gestionar ejercicios
- `/admin/feriados` - Gestión de feriados

---

## Generación

- PDF dinámico por rutina (generado desde página de detalle)

---

# Flujo del Usuario

## Flujo Público

1. Usuario accede al sitio web.
2. Visualiza el listado de rutinas.
3. Utiliza el buscador o filtros para encontrar una rutina.
4. Accede a la página de detalle.
5. Visualiza los días y ejercicios.
6. Descarga la rutina en PDF.

## Flujo Administrador

1. Administrador accede a `/admin/login`.
2. Ingresa DNI y contraseña.
3. Accede al dashboard del admin.
4. Crea/edita/elimina rutinas, días o ejercicios.
5. Gestiona precio de gimnasio y feriados.
6. Cierra sesión.

---

# Reglas del Sistema

- Solo el administrador puede modificar contenido.
- Los ejercicios deben mantener un orden específico dentro de cada día.
- Los días deben mantener un orden específico dentro de cada rutina.
- El documento PDF debe reflejar exactamente la estructura visible en la página de rutina.
- El login de administrador se realiza con DNI y contraseña.
- Los feriados indican días no laborables (no afectan el funcionamiento del sistema, solo se muestran públicamente).

---

# Stack Tecnológico

**Frontend**

- Next.js 16.1.6
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui

**Estado**

- Zustand 5

**Validación**

- Zod 4
- React Hook Form 7

**Backend**

- Next.js App Router (Server Actions)
- Better Auth 1.5.4

**ORM**

- Prisma 7

**Base de datos**

- PostgreSQL 18.3

**Testing**

- Playwright

---

# Arquitectura

## Server Actions

Toda la mutación de datos va por Server Actions en `src/app/actions/`:

### Rutinas
- `createRutina`
- `createRutinaCompleta`
- `updateRutina`
- `deleteRutina`
- `duplicateRutina`
- `getRutinas`
- `getRutina`

### Días
- `createDia`
- `updateDia`
- `deleteDia`

### Ejercicios
- `createEjercicio`
- `updateEjercicio`
- `deleteEjercicio`
- `reorderEjercicios`

### Gimnasio
- `updateGymPrice`
- `getGym`

### Feriados
- `createFeriado`
- `deleteFeriado`

### Auth
- `signIn` (Better Auth)
- `signOut` (Better Auth)
- `getSession` (Better Auth)

## Cache Invalidation

Se usa `revalidatePath` y `revalidateTag` para invalidar cache de Next.js después de mutaciones.

## Theme

El tema se maneja con Zustand store (`theme-store.ts`) y CSS custom properties en `globals.css`. El `ThemeProvider` aplica la clase `light` u `oscuro` al `<html>`.

---

# Consideraciones Técnicas

El sistema cumple con las siguientes características:

- interfaz web responsive
- arquitectura cliente-servidor (Next.js App Router)
- almacenamiento en base de datos (PostgreSQL)
- generación dinámica de documentos PDF
- despliegue en hosting web
- tema claro/oscuro con persistencia en localStorage
- CSS variables para theming consistente

---

# Success Metrics

Indicadores de funcionamiento del sistema:

- número de rutinas publicadas
- número de visualizaciones de rutinas
- número de descargas de PDF
- tiempo promedio de navegación en rutinas

---

# Open Issues

- optimización de rendimiento (lazy loading, code splitting)
- tests E2E con Playwright
- documentación de API

---

# Feature Timeline and Phasing

## Fase 1 — MVP ✅

- visualización de rutinas ✅
- página de detalle ✅
- estructura rutina / día / ejercicio ✅
- panel administrador básico ✅

## Fase 2 ✅

- buscador de rutinas ✅
- filtros por tipo y entrenador ✅
- generación de PDF ✅
- mejoras de UI ✅

## Fase 3 ✅

- optimización de rendimiento ✅
- mejoras del panel administrador ✅ (drag-and-drop, duplicado, feriados)
- tema claro/oscuro ✅

## Fase 4 — Pendiente

- tests E2E
- documentación de API
-cache warming para SEO
