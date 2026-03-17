# Spec: Fix Header Alignment

## Overview

Corregir la alineación vertical del contenedor flex que contiene SearchBar y navegación en la página principal.

## Requirements

### REQ-001

El contenedor flex en `src/app/page.tsx:72` DEBE usar `items-center` en lugar de `items-start` para centrar verticalmente los elementos cuando el layout es `sm:` (responsive breakpoint).

### REQ-002

El cambio NO DEBE afectar el comportamiento en mobile (menor a `sm:`), donde el layout es `flex-col`.

## Acceptance Criteria

- [ ] AC-1: La clase `items-start` es reemplazada por `items-center` en la línea 72
- [ ] AC-2: El SearchBar y los botones de navegación están verticalmente centrados en breakpoints `sm:` y mayores
- [ ] AC-3: No hay errores de TypeScript después del cambio
- [ ] AC-4: No hay errores de ESLint después del cambio
- [ ] AC-5: El layout mobile (antes de `sm:`) permanece sin cambios

## Scenarios

### Scenario 1: Alineación correcta en desktop

**Given** el usuario está en la página principal con viewport ≥640px  
**When** observa el área de búsqueda y navegación  
**Then** el SearchBar y los botones están verticalmente alineados al centro  

### Scenario 2: Layout mobile sin cambios

**Given** el usuario está en la página principal con viewport <640px  
**When** observa el layout vertical (flex-col)  
**Then** el comportamiento es idéntico al anterior (el breakpoint sm: no aplica)
