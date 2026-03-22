# Proposal: Rediseño de UI para Creación de Rutinas

## Metadata

- **Status**: Draft
- **Priority**: High
- **Type**: UX Improvement
- **Created**: 2026-03-22
- **Change Name**: routine-creation-ui-redesign

---

## 1. Problema

### Estado Actual

El formulario de creación de rutinas `rutina-completa-form.tsx` presenta varios problemas de UX:

| Aspecto | Estado Actual | Problema |
|---------|---------------|----------|
| Selección de tipo | Dropdown `<Select>` | Requiere click extra, menos visible |
| Días de entrenamiento | Bloques fijos expandidos | Carga cognitiva alta, todo visible a la vez |
| Inputs | Placeholders genéricos | No guían al usuario ("Ej: Sentadillas con barra") |
| Arquitectura | `useState`-based | Sin Signals, re-renders innecesarios |
| Colores | Sin identidad turquesa `#48b8c9` | No hay tokens CSS para color de marca |
| Diseño | Bordes pesados | No minimalista |

### Impacto en Usuario

- **Mayor carga cognitiva**: El usuario ve demasiados campos a la vez sin jerarquía clara
- **Fricción**: Selección de tipo requiere clicks adicionales
- **Incertidumbre**: Placeholders genéricos no ayudan a completar el formulario
- **Visualmente denso**: Diseño sin "aire", difícil escanear

---

## 2. Solución Propuesta

### Visión General

Rediseñar el formulario de creación de rutinas con:

1. **ChipSelector** para tipo de rutina (reemplaza dropdown)
2. **CollapsibleDiaSection** para días (acordeones)
3. **EjercicioRow mejorado** con formato `[Nombre] [Series] x [Repeticiones]`
4. **Tokens CSS** con color turquesa `#48b8c9`
5. **Focus states** con color de marca
6. **Placeholders** específicos y útiles

---

## 3. Componentes a Crear/Modificar

### 3.1 ChipSelector para Tipo de Rutina

```tsx
// Componente nuevo: components/admin/chip-selector.tsx
interface ChipSelectorProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}
```

**Visual Light Mode:**
```
┌─────────────────────────────────────────────────────┐
│  Tipo de Rutina                                     │
│                                                     │
│  [💪 Fuerza] [🏃 Cardio] [🧘 Flexibilidad] [💪 Hipertrofia]  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Visual Dark Mode:**
```
┌─────────────────────────────────────────────────────┐
│  Tipo de Rutina                                     │
│                                                     │
│  [- Fuerza -] [- Cardio -] [💪 Hipertrofia]         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Botones redondeados pequeños (chips/pills)
- **Light Mode**: Estado activo con fondo `#48b8c9` y texto blanco
- **Dark Mode**: Borde fino `#48b8c9`, al seleccionarse fondo `#48b8c9` con texto blanco
- Estados: default, hover, active, disabled
- Border radius: 12px-16px

### 3.2 CollapsibleDiaSection

```tsx
// Componente modificado: components/admin/dia-section.tsx
interface DiaSectionProps {
  dia: Dia;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (dia: Dia) => void;
  onDelete: () => void;
}
```

**Visual Light Mode:**
```
┌─────────────────────────────────────────────────────┐
│  ▼ Día 1: Tren Inferior                        [🗑️] │
├─────────────────────────────────────────────────────┤
│  (contenido colapsado cuando isExpanded: false)    │
└─────────────────────────────────────────────────────┘
```

**Visual Dark Mode (estilo tarjeta métrica Home):**
```
┌─────────────────────────────────────────────────────┐
│  ▼ Día 1: Tren Inferior              [−] [🗑️]     │
├─────────────────────────────────────────────────────┤
│  (contenido colapsado cuando isExpanded: false)    │
└─────────────────────────────────────────────────────┘
```

- Header clickeable para expandir/colapsar
- Chevron animado (rotación 90°)
- Botón eliminar en header
- Contenido expandido muestra ejercicios del día
- **Dark Mode**: Estilo tarjeta con fondo `#121212`, borde sutil `#2a2a2a`
- Border radius: 12px-16px

### 3.3 EjercicioRow Mejorado

```tsx
// Componente modificado: components/admin/ejercicio-row.tsx
interface EjercicioRowProps {
  ejercicio: Ejercicio;
  onUpdate: (ejercicio: Ejercicio) => void;
  onDelete: () => void;
}
```

**Visual Light Mode:**
```
┌─────────────────────────────────────────────────────┐
│  [Nombre del ejercicio    ]  [3] x [10]       [🗑️] │
│   Ej: Sentadillas con barra                           │
└─────────────────────────────────────────────────────┘
```

**Visual Dark Mode (inputs ultra-slim):**
```
┌─────────────────────────────────────────────────────┐
│  [Nombre del ejercicio...]  [3]  x  [10]     [🗑️]  │
│   Ej: Press de banca                                   │
└─────────────────────────────────────────────────────┘
```

- Layout horizontal: `[Nombre] [Series] x [Repeticiones] [Eliminar]`
- Placeholder: "Ej: Sentadillas con barra" (light) / "Ej: Press de banca" (dark)
- Ancho flexible para nombre, fijo para series/repes
- Micro-interacciones en hover
- **Dark Mode inputs ultra-slim**: Sin bordes pesados, solo base ligeramente más clara que el fondo de tarjeta (`#2a2a2a` sobre `#121212`)
- **Dark Mode placeholder**: Texto gris claro `#6b7280`
- **Dark Mode error feedback**: Borde sutil rojo coral `#ef4444`, minimalista

### 3.4 Tokens CSS - Color Turquesa

```css
/* globals.css - agregar después de:root */
:root {
  /* ... tokens existentes ... */
  
  /* Brand Colors */
  --color-accent: #48b8c9;
  --color-accent-hover: #3da4b3;
  --color-accent-active: #35899f;
  --color-accent-foreground: #ffffff;
  
  /* Focus Ring */
  --focus-ring: 0 0 0 2px var(--color-accent);
}
```

### 3.5 Focus States

```css
/* Input focus states */
input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: var(--focus-ring);
}
```

### 3.6 Dark Mode Tokens

```css
/* Dark Mode - se aplica con .dark class o media query */
.dark,
[data-theme="dark"] {
  /* Backgrounds */
  --color-base: #0a0a0a;
  --color-card: #121212;
  
  /* Accent */
  --color-accent: #48b8c9;
  --color-accent-foreground: #ffffff;
  
  /* Primary Button (estilo "Editar precio" Home) */
  --color-primary-btn: #ffffff;
  --color-primary-btn-text: #0a0a0a;
  
  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: #9ca3af;
  
  /* Borders */
  --color-border-light: #2a2a2a;
  
  /* Error */
  --color-error: #ef4444;
  
  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3);
}
```

### 3.7 Botón "Crear Rutina Completa" (Dark Mode)

**Ubicación**: Esquina superior derecha del formulario

**Visual Dark Mode:**
```
┌─────────────────────────────────────────────────────┐
│                                    [+ Crear Rutina] │
│  Tipo de Rutina                                     │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

- Botón sólido blanco `#ffffff`
- Texto negro `#0a0a0a`
- Estilo similar al botón "Editar precio" de la Home
- Border radius: 12px

### 3.8 Agregar Día - Botón Outline (Dark Mode)

**Visual Dark Mode:**
```
        ┌────────────────────────┐
        │  + Agregar Día         │
        └────────────────────────┘
```

- Outline con borde fino `#2a2a2a`
- Texto `#9ca3af`
- Centrado en el formulario
- Hover: borde turquesa `#48b8c9`

### 3.9 Agregar Ejercicio - Botón Discreto (Dark Mode)

**Visual Dark Mode:**
```
  + Agregar Ejercicio
```

- Texto + icono (no es botón prominente)
- Color `#9ca3af`
- Hover: color `#48b8c9`

---

## 4. Cambios de Diseño

### 4.1 Paleta de Colores

#### Light Mode

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-base` | #f9fafb | Background principal |
| `--color-card` | #ffffff | Fondo de tarjetas/contenedores |
| `--color-accent` | #48b8c9 | Botones principales, estados activos |
| `--color-border-light` | #e5e7eb | Bordes de inputs |
| `--color-text-primary` | #111827 | Títulos |
| `--color-text-secondary` | #6b7280 | Labels de campo |

#### Dark Mode

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-base` | #0a0a0a | Background principal (negro puro) |
| `--color-card` | #121212 | Fondo de tarjetas/contenedores (gris carbón) |
| `--color-accent` | #48b8c9 | Acento turquesa para selección |
| `--color-accent-foreground` | #ffffff | Texto sobre acento |
| `--color-primary-btn` | #ffffff | Botón primario sólido |
| `--color-primary-btn-text` | #0a0a0a | Texto en botón primario |
| `--color-text-primary` | #ffffff | Títulos |
| `--color-text-secondary` | #9ca3af | Labels y textos secundarios |
| `--color-border-light` | #2a2a2a | Bordes sutiles (ligeramente más claro que card) |
| `--color-error` | #ef4444 | Feedback de error (rojo coral sutil) |

> **Nota**: El formulario debe funcionar en ambos temas (light/dark) usando CSS custom properties.

### 4.2 Tipografía

```css
/* Títulos */
h1, h2, h3 {
  font-weight: 700;
}

/* Labels */
label {
  font-weight: 500;
  color: var(--color-text-secondary);
}
```

### 4.3 Dimensiones y Espaciado

| Elemento | Valor |
|----------|-------|
| Border radius inputs | 8px - 12px |
| Padding inputs | 10px - 14px |
| Border width | 1px |
| Border color | #e5e7eb |
| Gap entre secciones | 24px |
| Shadow (cards) | 0 1px 3px rgba(0,0,0,0.1) |

---

## 5. Arquitectura de Componentes

### Jerarquía Propuesta

```
RutinaCompletaForm (useState → useForm eventually)
├── RutinaHeader
│   └── ChipSelector (tipo de rutina)
├── DiasList
│   └── DiaSection[] (collapsible)
│       ├── DiaHeader (toggle + delete)
│       └── EjerciciosList
│           └── EjercicioRow[]
└── ActionButtons
    ├── AddDiaButton
    └── SubmitButton
```

### Flujo de Datos (Futuro: Signals)

```tsx
// Estado inicial
const [rutina, setRutina] = useState<RutinaFormData>({
  nombre: '',
  tipo: 'fuerza',
  descripcion: '',
  dias: [{
    id: generateId(),
    nombre: '',
    ejercicios: []
  }]
});

// Handler para chips
const handleTipoChange = (tipo: string) => {
  setRutina(prev => ({ ...prev, tipo }));
};
```

---

## 6. Alternativas Consideradas

| Alternativa | Descripción | Por qué no |
|-------------|-------------|------------|
| Wizard de pasos | Dividir en 3 pantallas | Más navegaciones, mismo problema |
| Cards en vez de acordeones | Cards fijos expandibles | Ocupa más espacio, menos scannable |
| Select múltiple para tipo | Checkboxes | UX confusa para single-select |
| Drag & drop reordenamiento | Drag para ejercicios | Scope creep, no solicitado |

---

## 7. Definition of Done

### Light Mode
- [ ] `ChipSelector` creado con estados hover/active/disabled
- [ ] `ChipSelector` usa color `#48b8c9` para estado activo
- [ ] `DiaSection` es colapsable con chevron animado
- [ ] `EjercicioRow` tiene formato `[Nombre] [Series] x [Repeticiones]`
- [ ] Placeholders específicos: "Ej: Sentadillas con barra"
- [ ] Tokens CSS para `--color-accent` y `--focus-ring` agregados a `globals.css`
- [ ] Focus state en todos los inputs usa `--color-accent`
- [ ] Diseño minimalista: bordes ligeros, sombras suaves
- [ ] Border radius 8px-12px en inputs
- [ ] Formulario funcional con datos en useState

### Dark Mode
- [ ] Fondo principal `#0a0a0a`, tarjetas `#121212`
- [ ] Botón "Crear Rutina" sólido blanco `#ffffff` en esquina superior derecha
- [ ] `ChipSelector` con borde fino, selección turquesa `#48b8c9`
- [ ] `DiaSection` estilo tarjeta métricas Home (colapsable)
- [ ] `EjercicioRow` inputs ultra-slim (borde sutil `#2a2a2a`)
- [ ] Placeholders descriptivos dark: "Nombre de la rutina...", "Ej: Press de banca"
- [ ] Botón "+ Agregar Ejercicio" discreto (texto + icono)
- [ ] Botón "+ Agregar Día" outline centrado con borde fino
- [ ] Error feedback con borde rojo coral sutil `#ef4444`
- [ ] Textos secundarios en `#9ca3af`
- [ ] Títulos en `#ffffff`
- [ ] Border radius 12px-16px en componentes dark

### Dual Theme Support
- [ ] Formulario funciona en ambos temas (light/dark)
- [ ] Tokens CSSusan custom properties para colores
- [ ] No hardcodear colores - usar variables CSS

---

## 8. Estimación de Esfuerzo

| Tarea | Estimación | Complejidad |
|-------|------------|-------------|
| Crear `ChipSelector` component | 2h | Low |
| Agregar tokens CSS (light + dark) | 1h | Low |
| Modificar `DiaSection` a colapsable | 3h | Medium |
| Mejorar `EjercicioRow` | 2h | Low |
| Aplicar estilos y focus states | 2h | Low |
| **Dark Mode tokens y componentes** | **3h** | **Medium** |
| Integración y testing (dual theme) | 3h | Medium |
| **Total** | **~16h** | **Medium** |

---

## 9. Archivos Afectados

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/components/admin/rutina-completa-form.tsx` | Modificar | Agregar ChipSelector, ajustar layout |
| `src/components/admin/dia-section.tsx` | Modificar | Agregar colapsable, estados |
| `src/components/admin/ejercicio-row.tsx` | Modificar | Layout horizontal, placeholders |
| `src/app/globals.css` | Modificar | Agregar tokens CSS turquesa |
| `src/components/admin/chip-selector.tsx` | **Crear** | Componente nuevo |

---

## 10. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Breaking changes en CSS global | Media | Alto | Verificar en todas las pages |
| Conflictos con estilos shadcn | Baja | Medio | Usar clases de utilities, no selectores globales |
| Formulario muy largo con muchos días | Media | Bajo | Collapsible mitiga esto |
