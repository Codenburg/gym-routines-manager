# Proposal: Simplificar flujo de creación de rutinas

## Metadata

- **Status**: Pending
- **Priority**: High
- **Type**: Feature
- **Created**: 2026-03-13

---

## 1. Problema

El flujo actual de creación de rutinas requiere **5 navegaciones** entre páginas:

1. `/admin/rutinas/nueva` → Crear Rutina básica (nombre, tipo, descripción)
2. `/admin/rutinas/[id]` → Ver rutina creada
3. `/admin/rutinas/[id]/editar` → Editar rutina
4. Agregar Días → Nueva página/modal para cada día
5. Agregar Ejercicios → Nueva página/modal para cada ejercicio

Esto es tedioso y requiere muchos pasos para algo que podría hacerse en una sola pantalla.

---

## 2. Solución Propuesta

Crear un **formulario único** que permita crear la rutina completa en un solo paso:

### Frontend: Nueva página `/admin/rutinas/nueva/completa`

Formulario anidado con:
- **Datos de Rutina**: nombre, tipo, descripción
- **Array de Días**: lista dinámica donde cada día tiene:
  - nombre
  - musculosEnfocados (opcional)
  - Array de Ejercicios: lista dinámica donde cada ejercicio tiene:
    - nombre
    - series (opcional)
    - repes (opcional)

### Backend: Nueva acción `createRutinaCompleta`

```typescript
// app/actions/rutinas.ts
export async function createRutinaCompleta(
  prevState: FormState,
  formData: FormData
): Promise<FormState<{ id: string }>> {
  // 1. Validar datos con schema zod anidado
  // 2. Crear transacción prisma.$transaction:
  //    - Crear Rutina
  //    - Crear Días asociados
  //    - Crear Ejercicios asociados
  // 3. Revalidar paths
}
```

---

## 3. Schema Propuesto (Zod)

```typescript
import { z } from "zod";

const ejercicioSchema = z.object({
  nombre: z.string().min(1, "Nombre del ejercicio es requerido"),
  series: z.string().optional(),
  repes: z.string().optional(),
});

const diaSchema = z.object({
  nombre: z.string().min(1, "Nombre del día es requerido"),
  musculosEnfocados: z.string().optional(),
  ejercicios: z.array(ejercicioSchema).min(1, "Al menos un ejercicio por día"),
});

export const rutinaCompletaSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  tipo: z.enum(["fuerza", "cardio", "flexibilidad", "hipertrofia"]),
  descripcion: z.string().optional(),
  dias: z.array(diaSchema).min(1, "Al menos un día es requerido"),
});
```

---

## 4. UI/UX

### Diseño propuesto (Single Page Form)

```
┌─────────────────────────────────────────────────────────┐
│  NUEVA RUTINA COMPLETA                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ─── Datos de la Rutina ───                            │
│  [Nombre *]    [Tipo *]                                │
│  [Descripción]                                         │
│                                                         │
│  ─── Días de la Rutina ───                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Día 1: [Nombre *]  [Músculos Enfocados]       │   │
│  │                                                │   │
│  │ Ejercicios:                                    │   │
│  │  ┌────────────────────────────────────────┐    │   │
│  │  │ [Nombre *]  [Series]  [Repes]        │    │   │
│  │  └────────────────────────────────────────┘    │   │
│  │                                                │   │
│  │  [+ Agregar Ejercicio]                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [+ Agregar Día]                                        │
│                                                         │
│  ───────────────────────────────────────────────────   │
│  [Cancelar]                        [Crear Rutina]      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Componentes necesarios

1. `RutinaCompletaForm` - Formulario principal
2. `DiaSection` - Componente para cada día (collapsible)
3. `EjercicioRow` - Fila para cada ejercicio
4. Botones dinámicos: agregar/eliminar días y ejercicios

---

## 5. Cambios Requeridos

### Archivos a modificar/crear:

| Archivo | Acción |
|---------|--------|
| `lib/schemas.ts` | Agregar `rutinaCompletaSchema`, `ejercicioSchema`, `diaSchema` |
| `app/actions/rutinas.ts` | Agregar `createRutinaCompleta` con `prisma.$transaction` |
| `components/admin/rutina-completa-form.tsx` | **NUEVO** - Formulario completo |
| `app/admin/rutinas/nueva/completa/page.tsx` | **NUEVO** - Página del formulario |

### Flujo de datos:

```
Formulario → createRutinaCompleta → prisma.$transaction → 
  → prisma.rutina.create() 
  → prisma.dia.createMany() 
  → prisma.ejercicio.createMany()
```

---

## 6. Consideraciones Técnicas

1. **Transacción atómica**: Usar `prisma.$transaction` para garantizar consistencia
2. **Validación en cliente**: Validación en tiempo real con Zod antes de submit
3. **Ordenamiento automático**: Los días y ejercicios se guardan con `orden: 0, 1, 2...`
4. **Manejo de errores**: Si falla algún paso, se hace rollback completo

---

## 7. Alternativas Considered

| Alternativa | Descripción | Descartada porque |
|-------------|-------------|-------------------|
| Wizard de 3 pasos | Dividir en pasos (Rutina → Días → Ejercicios) | Todavía requiere múltiples navegaciones |
| Modal anidado | Usar modales en lugar de página completa | UX más compleja, menos espacio |

---

## 8. Definition of Done

- [ ] Schema Zod `rutinaCompletaSchema` creado y validado
- [ ] Acción `createRutinaCompleta` con transacción prisma funcionando
- [ ] Página `/admin/rutinas/nueva/completa` accesible
- [ ] Formulario permite agregar/eliminar días dinámicamente
- [ ] Formulario permite agregar/eliminar ejercicios por día dinámicamente
- [ ] Validación muestra errores claros
- [ ] После éxito, redirige a `/admin/rutinas/[id]` con la rutina creada

---

## 9. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Formulario muy largo | Usar componentes colapsables para días |
| Validación compleja | Zod anidado con mensajes claros |
| UX confuse | Diseño limpio con secciones claras |
