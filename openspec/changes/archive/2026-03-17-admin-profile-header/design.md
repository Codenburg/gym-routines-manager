# Design: Agregar componente de perfil en el header del panel admin

## Technical Approach

Se implementará un componente de perfil custom dentro del `AdminLayout` existente que muestra el nombre del administrador y un dropdown para cerrar sesión. Se utilizará React state (`useState`, `useEffect`, `useRef`) para manejar el estado del dropdown sin dependencias adicionales de shadcn/ui, reutilizando los componentes y patrones existentes del proyecto.

## Architecture Decisions

### Decision: Implementación custom del dropdown vs shadcn DropdownMenu

**Choice**: Implementación custom con useState/useRef
**Alternatives considered**: 
- Usar shadcn/ui DropdownMenu (ya instalado en el proyecto)
- Usar Radix UI directamente
**Rationale**: 
- El dropdown es simple (solo una opción) y la implementación custom es más ligera
- Evita agregar dependencia adicional ya que el proyecto no tiene DropdownMenu instalado
- Permite control granular sobre accesibilidad y comportamientos específicos
- Sigue el patrón existente de componentes custom pequeños en el proyecto

### Decision: Obtención de datos de sesión

**Choice**: Usar `useSession()` de `@/lib/auth-client`
**Alternatives considered**:
- Pasar datos como props desde el server component
- Usar `getSession()` directamente
**Rationale**:
- `useSession()` es el hook estándar de better-auth para client components
- El AdminLayout ya es un client component (`"use client"`)
- Permite acceso reactivo a cambios en la sesión sin re-renders innecesarios

### Decision: Manejo de click outside y Escape

**Choice**: useRef + useEffect con event listeners
**Alternatives considered**:
- Usar una librería externa como @radix-ui/react-dismissable-layer
- Implementar con document-level event listener sin cleanup
**Rationale**:
- El patrón useRef + useEffect es el estándar en React para este caso de uso
- Cleanup apropiado en el return del useEffect para evitar memory leaks
- Sin dependencias adicionales necesarias

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     AdminLayout                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Header                             │   │
│  │  ┌─────────────────────┐  ┌─────────────────────┐   │   │
│  │  │  Title              │  │  ProfileButton     │   │   │
│  │  │                     │  │  ┌───────────────┐ │   │   │
│  │  │                     │  │  │ User Icon    │ │   │   │
│  │  │                     │  │  │ admin.name   │ │   │   │
│  │  │                     │  │  │ Caret        │ │   │   │
│  │  │                     │  │  └───────────────┘ │   │   │
│  │  │                     │  │         │           │   │   │
│  │  │                     │  │    ┌────▼────────┐  │   │   │
│  │  │                     │  │    │ Dropdown    │  │   │   │
│  │  │                     │  │    │ - Cerrar    │  │   │   │
│  │  │                     │  │    │   sesión   │  │   │   │
│  │  │                     │  │    └────────────┘  │   │   │
│  │  └─────────────────────┘  └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   useSession()                       │   │
│  │              (from @/lib/auth-client)                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Flujo de interacción**:
1. Usuario hace click en ProfileButton → `setIsOpen(true)`
2. Dropdown se renderiza con `role="menu"` y `aria-expanded="true"`
3. Usuario hace click fuera o presiona Escape → `setIsOpen(false)`
4. Usuario hace click en "Cerrar sesión" → `signOut()` → router.push("/admin/login")

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/admin-layout.tsx` | Modify | Reemplazar botón de logout con componente ProfileButton con dropdown |

## Interfaces / Contracts

```typescript
// Admin user type from session (already exists in codebase)
interface AdminUser {
  id: string;
  name: string;
  admin?: boolean;
  // ... other fields from better-auth
}

// ProfileButton component props (internal)
interface ProfileButtonProps {
  userName: string;
  onSignOut: () => Promise<void>;
}

// Dropdown state (internal)
interface DropdownState {
  isOpen: boolean;
  // Controlled via useState
}
```

**Manejo de sesión**:
```typescript
// En AdminLayout
const { data: session } = useSession();
const userName = (session?.user as { name?: string })?.name || "Admin";
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Dropdown open/close logic | Verificar estados de isOpen con diferentes interacciones |
| Integration | Click outside cierra dropdown | Testing manual verificando el useRef |
| Integration | Escape cierra dropdown | Testing manual presionando la tecla |
| Integration | Logout redirige correctamente | Verificar router.push después de signOut |

**Nota**: El proyecto no tiene infraestructura de tests configurada según `openspec/config.yaml`. Testing será manual.

## Migration / Rollback

No se requiere migración de datos. El cambio es puramente de UI.

**Rollback**: 
1. Eliminar el ProfileButton component
2. Restaurar el Button original con el icono LogOut
3. El código original está versionado en git

## Open Questions

- [ ] ¿El campo `name` siempre está presente en session.user o puede ser null/undefined? (Se maneja con fallback "Admin")
- [ ] ¿Se desea agregar transición/animación al dropdown? (No especificado en requisitos, implementado sin animación)

## Accessibility Requirements

| Requisito | Implementación |
|-----------|---------------|
| aria-expanded | En button: `aria-expanded={isOpen}` |
| aria-haspopup | En button: `aria-haspopup="menu"` |
| role="menu" | En dropdown container |
| role="menuitem" | En opción de logout |
| Escape key | useEffect con listener en document |
| Focus management | Button recupera foco al cerrar dropdown |
