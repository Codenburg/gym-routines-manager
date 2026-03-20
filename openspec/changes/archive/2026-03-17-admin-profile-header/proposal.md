# Proposal: Agregar componente de perfil en el header del panel admin

## Intent

Mejorar la experiencia de usuario en el panel de administración mostrando el nombre del administrador conectado con un dropdown menu para cerrar sesión. Actualmente solo existe un botón de "Cerrar sesión" sin contexto visual del usuario logueado.

## Scope

### In Scope
- Implementar componente de perfil en el header del AdminLayout
- Mostrar nombre del admin con icono de usuario (lucide-react)
- Dropdown con opción "Cerrar sesión"
- Manejo de estados: hover, active, dropdown abierto/cerrado
- Accesibilidad: aria-expanded, gestión de foco, teclado (Escape para cerrar)
- Click outside para cerrar dropdown

### Out of Scope
- Cambio en la lógica de autenticación (ya existe signOut)
- Agregar más opciones al dropdown (solo "Cerrar sesión" por ahora)
- Edición de perfil o configuración de cuenta

## Approach

Implementación custom con React state (`useState`, `useEffect`, `useRef`) para el dropdown. No se requieren dependencias adicionales de shadcn/ui. Se reutiliza el componente Button existente de shadcn y el icono User de lucide-react.

**Patrón técnico**:
- useState para controlar estado abierto/cerrado del dropdown
- useRef para detectar click outside
- useEffect para manejar evento de teclado (Escape)
- aria-expanded y aria-haspopup para accesibilidad
- Posicionamiento del dropdown alineado al botón

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/admin/admin-layout.tsx` | Modified | Agregar componente de perfil en el header existente |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dropdown no se cierra al hacer click fuera | Low | Implementar useRef con event listener en document |
| Problemas de accesibilidad | Low | Usar aria-expanded, aria-haspopup, y focus management |
| Incompatibilidad con estado de sesión | Low | Verificar que session.user.name esté disponible |

## Rollback Plan

Revertir cambios en `src/components/admin/admin-layout.tsx` eliminando el componente de perfil y restaurando el botón simple de "Cerrar sesión" con LogOut icon. El código original ya está versionado en git.

## Dependencies

- `@/lib/auth-client` - Ya existe para signOut
- `lucide-react` - Ya instalado para iconos
- `shadcn/ui Button` - Ya disponible en el proyecto

## Success Criteria

- [ ] El nombre del admin se muestra en el header (derecha)
- [ ] Icono de usuario (User) precede al nombre
- [ ] Click en el perfil abre el dropdown
- [ ] Dropdown contiene opción "Cerrar sesión"
- [ ] Click outside cierra el dropdown
- [ ] Tecla Escape cierra el dropdown
- [ ] El dropdown está alineado al botón de perfil
- [ ] Estados hover/active visibles en botón y opciones
- [ ] Atributos aria-expanded正确 reflejando estado
- [ ] Logout redirige a /login
