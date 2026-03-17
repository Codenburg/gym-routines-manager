# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Sistema Web de Gestión y Visualización de Rutinas de Gimnasio

**Estado del documento:** Draft / En planificación

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

1. No se incluye sistema de usuarios registrados.
2. No se incluye sistema de pagos.
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

---

## Administrador

Persona responsable de gestionar el contenido del sistema.

**Objetivos**

- crear rutinas
- editar contenido
- organizar días de entrenamiento
- definir ejercicios y orden

---

# Use Cases

## Escenario 1 — Exploración de rutinas

Un usuario accede al sitio web y visualiza un listado de rutinas disponibles. Utiliza el buscador para encontrar una rutina específica.

---

## Escenario 2 — Visualización de rutina

El usuario selecciona una rutina y accede a su página de detalle, donde puede ver los días de entrenamiento y los ejercicios organizados.

---

## Escenario 3 — Descarga de rutina

El usuario descarga la rutina completa en formato PDF para poder utilizarla fuera del sistema.

---

# PRD

# Features In

## Visualización pública de rutinas

El sistema muestra un listado accesible de rutinas disponibles para todos los visitantes.

Incluye:

- listado general
- buscador
- acceso a detalle

---

## Página de detalle de rutina

Cada rutina posee una página dedicada que muestra:

- nombre de la rutina
- descripción
- tipo de entrenamiento
- días de entrenamiento
- ejercicios organizados

---

## Estructura jerárquica del contenido

El contenido se organiza en tres niveles:

Rutina → Día → Ejercicio

Cada día contiene múltiples ejercicios ordenados.

---

## Generación de PDF

El sistema permite generar automáticamente un documento PDF que reproduce exactamente la estructura de la rutina visible en pantalla.

---

## Panel administrador

Interfaz privada para gestión del contenido.

Permite:

- crear rutinas
- editar rutinas
- eliminar rutinas
- crear días
- editar días
- crear ejercicios
- editar ejercicios
- ordenar ejercicios

---

# Features Out

Las siguientes funcionalidades quedan fuera del alcance inicial del sistema:

- registro de usuarios
- sistema de autenticación para usuarios públicos
- seguimiento de progreso de entrenamiento
- pagos o suscripciones
- múltiples roles de administración
- aplicación móvil nativa

---

# Modelo de Datos

## Rutina

Campos:

- id
- nombre
- tipo
- descripcion

Relación:

Una rutina contiene múltiples días.

---

## Día

Campos:

- id
- rutina_id
- nombre
- musculos_enfocados

Relación:

Un día contiene múltiples ejercicios.

---

## Ejercicio

Campos:

- id
- dia_id
- nombre
- orden

---

## Relaciones

Rutina  
→ múltiples Días

Día  
→ múltiples Ejercicios

---

# Pantallas del Sistema

## Públicas

- Home (listado + buscador)
- Página de información
- Página de detalle de rutina

---

## Administrador

- Login administrador
- Listado de rutinas
- Formulario crear / editar rutina
- Gestión de días
- Gestión de ejercicios

---

## Generación

- PDF dinámico por rutina

---

# Flujo del Usuario

1. Usuario accede al sitio web.
2. Visualiza el listado de rutinas.
3. Utiliza el buscador o selecciona una rutina.
4. Accede a la página de detalle.
5. Visualiza los días y ejercicios.
6. Descarga la rutina en PDF.

---

# Reglas del Sistema

- Solo el administrador puede modificar contenido.
- Los ejercicios deben mantener un orden específico dentro de cada día.
- El documento PDF debe reflejar exactamente la estructura visible en la página de rutina.

---

# Consideraciones Técnicas

El sistema debe cumplir con las siguientes características:

- interfaz web responsive
- arquitectura cliente-servidor
- almacenamiento en base de datos
- generación dinámica de documentos PDF
- despliegue en hosting web

---

# Stack Tecnológico

**Frontend**

- Next.js

**Backend**

- Next.js API / Node.js

**ORM**

- Prisma

**Base de datos**

- PostgreSQL

---

# Success Metrics

Indicadores de funcionamiento del sistema:

- número de rutinas publicadas
- número de visualizaciones de rutinas
- número de descargas de PDF
- tiempo promedio de navegación en rutinas

---

# Open Issues

- definición del diseño visual final
- selección del proveedor de hosting
- diseño del template de PDF

---

# Feature Timeline and Phasing

## Fase 1 — MVP

- visualización de rutinas
- página de detalle
- estructura rutina / día / ejercicio
- panel administrador básico

---

## Fase 2

- buscador de rutinas
- mejoras de UI
- generación de PDF

---

## Fase 3

- optimización de rendimiento
- mejoras del panel administrador
- mejoras en exportación de rutinas