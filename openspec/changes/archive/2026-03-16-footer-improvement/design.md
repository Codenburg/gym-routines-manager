# Design: Footer Layout Improvement

## Technical Approach

Convert the `Footer` component from a Server Component to a Client Component by adding the `"use client"` directive. Use `usePathname` from `next/navigation` to detect the current route and conditionally return `null` when pathname equals `/admin/login`.

For layout, implement a three-column flexbox structure:
- **Left column**: Empty spacer (`flex-1`) to push content away from the left edge
- **Center column**: Copyright text with `text-center` to center horizontally
- **Right column**: Admin button wrapped in a container with `flex justify-end`

This approach satisfies all three requirements: centered copyright, right-aligned button, and conditional hiding on admin login page.

## Architecture Decisions

### Decision: Use Client-Side Route Detection

**Choice**: Convert Footer to client component using `usePathname` hook
**Alternatives considered**: 
- Server-side solution using `headers()` or middleware
- CSS-only hiding using `display: none` on specific routes
**Rationale**: The spec explicitly requires client-side route detection (Requirement: "Client-Side Route Detection"). Using `usePathname` is the standard Next.js pattern for client-side route-based conditional rendering. It's simple, doesn't require middleware configuration, and provides immediate feedback after navigation completes.

### Decision: Three-Column Flexbox Layout

**Choice**: Flex container with left spacer, center copyright, right button
**Alternatives considered**:
- Two-column with `justify-between` and negative margins (fragile)
- CSS Grid with 3 equal columns (overkill)
- Absolute positioning for the button (breaks responsive behavior)
**Rationale**: This is the most robust and maintainable approach. Using `flex-1` on left and right ensures the copyright stays centered regardless of button width or container changes. The approach follows the existing flexbox pattern already in the component.

## Data Flow

```
Page Navigation
      │
      ▼
Footer Component Mounts
      │
      ▼
usePathname() returns current route
      │
      ├──► /admin/login ──► return null (hide footer)
      │
      └──► Other routes ──► Render footer with 3-column layout
                                │
                                ├──► Left: flex-1 (empty spacer)
                                ├──► Center: © 2026 Codenburg (text-center)
                                └──► Right: Administradores button (justify-end)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/footer.tsx` | Modify | Add "use client", import usePathname, add conditional logic, update layout |

### Detailed Changes to `components/footer.tsx`

1. **Add "use client" directive** at the top of the file
2. **Add import**: `import { usePathname } from "next/navigation";`
3. **Add hook**: `const pathname = usePathname();`
4. **Add conditional return**: Check `pathname === "/admin/login"` and return `null`
5. **Update layout**:
   - Change `flex-row items-center justify-between` to a 3-column structure
   - Add empty left spacer: `<div className="flex-1" />`
   - Wrap copyright in center column with `text-center flex-1`
   - Wrap button in right column: `<div className="flex-1 flex justify-end">`

## Interfaces / Contracts

No new interfaces or types required. The component remains a simple presentational component.

### TypeScript Types

```typescript
// No new types needed - existing component signature remains:
// export function Footer(): JSX.Element
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual | Footer centered on all viewport sizes | Manual testing on mobile, tablet, desktop |
| Visual | Button aligned to right edge | Manual testing |
| Functional | Footer hidden on /admin/login | Navigate to route, verify DOM does not contain footer |
| Functional | Footer visible on /admin | Navigate to route, verify footer renders |
| Functional | Footer visible on public pages (/, /rutinas) | Navigate to routes, verify footer renders |
| TypeScript | No compilation errors | Run `npx tsc --noEmit` |
| ESLint | No new warnings | Run `npm run lint` |

### Manual Test Scenarios

1. Navigate to `/` - Footer should show with centered copyright and right button
2. Navigate to `/rutinas` - Footer should show
3. Navigate to `/admin` - Footer should show
4. Navigate to `/admin/login` - Footer should NOT appear in DOM
5. Resize browser to mobile width - Copyright should remain centered

## Migration / Rollout

No migration required. This is a purely additive frontend change with no database or persistent storage impact.

The change is immediately deployable and safe to ship without feature flags or phased rollout.

## Open Questions

- [ ] None - All requirements are clear from specs and proposal
