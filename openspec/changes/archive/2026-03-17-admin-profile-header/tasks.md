# Tasks: Agregar componente de perfil en el header del panel admin

## Phase 1: Foundation - Imports y Setup

- [ ] 1.1 Agregar import de `User` icon de lucide-react en `src/components/admin/admin-layout.tsx` (línea 10)
- [ ] 1.2 Agregar import de `useSession` desde `@/lib/auth-client` en `src/components/admin/admin-layout.tsx`
- [ ] 1.3 Agregar imports de `useRef` y `useEffect` desde React (ya está useState en línea 3)

## Phase 2: Core Implementation - ProfileButton Component

- [ ] 2.1 Crear componente interno `ProfileButton` dentro de `AdminLayout` con props: `userName: string`, `onSignOut: () => Promise<void>`
- [ ] 2.2 Implementar estado `isOpen` con `useState<boolean>(false)` para controlar el dropdown
- [ ] 2.3 Crear `dropdownRef` con `useRef<HTMLDivElement>(null)` para detección de click outside
- [ ] 2.4 Implementar `useEffect` para cerrar dropdown al hacer click fuera del componente (usar `document.addEventListener`)
- [ ] 2.5 Implementar `useEffect` para cerrar dropdown al presionar Escape (keydown listener en document)
- [ ] 2.6 Agregar cleanup function en ambos useEffects para removeEventListener
- [ ] 2.7 Renderizar botón de perfil con `User` icon, nombre del admin, y indicador visual de dropdown (caret)
- [ ] 2.8 Agregar atributos de accesibilidad al botón: `aria-expanded={isOpen}`, `aria-haspopup="menu"`, `aria-label="Menú de perfil"`
- [ ] 2.9 Renderizar dropdown menu con `role="menu"` cuando `isOpen === true`
- [ ] 2.10 Renderizar opción "Cerrar sesión" dentro del dropdown con `role="menuitem"` y `LogOut` icon
- [ ] 2.11 Agregar estilos hover/active states al botón de perfil y a la opción de logout
- [ ] 2.12 Implementar right-alignment del dropdown respecto al botón de perfil

## Phase 3: Integration - Wire Session Data

- [ ] 3.1 Extraer datos de sesión con `const { data: session } = useSession()` al inicio del componente AdminLayout
- [ ] 3.2 Obtener nombre del admin: `const userName = session?.user?.name || "Admin"`
- [ ] 3.3 Reemplazar el Button de "Cerrar sesión" en el header (líneas 110-113) con el nuevo componente `<ProfileButton userName={userName} onSignOut={handleSignOut} />`
- [ ] 3.4 Verificar que el layout del header se mantenga intacto (flex items-center justify-between)

## Phase 4: Verification - Manual Testing

- [ ] 4.1 Verificar que el nombre del admin se muestra en el header con el icono User
- [ ] 4.2 Verificar que hacer click en el perfil abre el dropdown
- [ ] 4.3 Verificar que aria-expanded cambia de "false" a "true" al abrir
- [ ] 4.4 Verificar que hacer click fuera del dropdown lo cierra
- [ ] 4.5 Verificar que presionar Escape cierra el dropdown y el foco vuelve al botón
- [ ] 4.6 Verificar que la opción "Cerrar sesión" funciona y redirige a /admin/login
- [ ] 4.7 Verificar estados hover/active en botón de perfil y opción de logout
- [ ] 4.8 Verificar fallback "Admin" cuando session.user.name no está disponible
