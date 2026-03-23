# Proposal: Rediseñar Pantalla Editar Rutina Champion Gym

## Overview

Rediseñar la pantalla de edición de rutinas del Champion Gym con un nuevo sistema de colores dual (turquesa en modo claro, rojo en modo oscuro), nuevos componentes (SegmentedControl, RoutineDayCard), y layout responsivo.

## Problem Statement

La pantalla actual de edición de rutinas necesita:
1. Actualización visual con colores duales (turquesa/rojo)
2. Selector de tipo de rutina basado en SegmentedControl
3. Grid responsivo de días usando RoutineDayCard
4. Mejor experiencia en móvil con cards de día

## Intent

Rediseñar la UI de edición de rutinas con un sistema de diseño moderno y coherente.

## Scope

### In Scope
- Crear SegmentedControl para tipo de rutina
- Crear RoutineDayCard para grid de días
- Actualizar globals.css con tokens de color duales
- Actualizar RutinaForm y DiaManager

### Out of Scope
- Cambios en API o schema de base de datos
- Cambios en server actions

## Approach

1. Agregar tokens CSS duales (turquesa/rojo) a globals.css
2. Crear componente SegmentedControl
3. Crear componente RoutineDayCard
4. Refactorizar RutinaForm para usar SegmentedControl
5. Refactorizar DiaManager para usar RoutineDayCard grid

## Status

Archived - Design finalized with dual-color system

## Final Color System

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Accent/Selected | `#48b8c9` (turquoise) | `#E11D48` (red) |
| Focus ring | `#48b8c9` | `#E11D48` |
| Cancel hover | `#ef4444` | `#E11D48` |
| Page background | `#f8fafc` | `#09090b` |
| Card background | `#ffffff` | `#18181b` |
| Border | `#e2e8f0` | `#27272a` |
| Secondary text | `#64748b` | `#a1a1aa` |
