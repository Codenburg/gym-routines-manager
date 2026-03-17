# Design: Fix Header Alignment

## Overview

Este documento describe el cambio mínimo necesario para corregir la alineación del header.

## Technical Details

### Current Code (línea 72)

```tsx
<div className="flex flex-col sm:flex-row items-start gap-3">
```

### Proposed Change

```tsx
<div className="flex flex-col sm:flex-row items-center gap-3">
```

## Reasoning

- `items-start` alinea los elementos al inicio vertical del contenedor flex
- `items-center` centra los elementos verticalmente
- En el layout actual (`sm:flex-row`), el SearchBar y los botones de navegación tienen alturas diferentes, causando desalineación visible
- `items-center` resuelve esto centrando ambos elementos verticalmente

## Architecture Impact

- **Files affected**: 1
- **Lines changed**: 1
- **Dependencies**: Ninguna
- **Breaking changes**: Ninguna

## Testing Strategy

Verificación visual manual en:
1. Mobile viewport (<640px) - layout vertical sin cambios
2. Desktop viewport (≥640px) - verificar alineación centrada
