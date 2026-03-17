# Proposal: Footer Layout Improvement

## Intent

Improve the footer component to center the copyright text, align the admin button to the right, and hide the footer on the `/admin/login` page. This addresses UX inconsistencies and prevents the footer from appearing on the admin login page where it serves no purpose.

## Scope

### In Scope
- Center the "© 2026 Codenburg" text horizontally in the footer
- Move the "Administradores" button to the right side of the footer
- Hide the footer component entirely when the user is on `/admin/login`
- Convert footer to client component to enable pathname detection

### Out of Scope
- Any changes to admin panel pages beyond login
- Modifying footer styling beyond layout adjustments
- Adding new footer features or links

## Approach

Convert the `Footer` component to a client component using the `"use client"` directive. Use the `usePathname` hook from `next/navigation` to detect the current route. When the pathname equals `/admin/login`, return `null` to hide the footer entirely.

For layout:
- Replace `justify-between` with a two-column approach
- Use `flex-1` on both the left (empty) and right (button) sections to push the copyright to center
- Alternatively, use absolute positioning or a 3-column grid with center being the copyright

The recommended approach uses flexbox with three sections:
- Left: empty spacer (`flex-1`)
- Center: copyright text (centered)
- Right: admin button (`flex-1` with `flex justify-end`)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `components/footer.tsx` | Modified | Convert to client component, update layout, add pathname detection |
| `app/layout.tsx` | No Change | Footer already imported and used; no changes needed |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Client-side route detection causes flash on navigation | Low | Use `usePathname` which is optimized for this; minimal delay expected |
| Footer still appears briefly before hiding | Low | This is acceptable for admin login; can be improved later with server-side solution if needed |

## Rollback Plan

1. Revert `components/footer.tsx` to the original server component version
2. Remove `"use client"` directive
3. Remove `usePathname` import and hook
4. Restore original flex layout with `justify-between`

The change is purely additive and reversible without database or migration impact.

## Dependencies

- `next/navigation` - Already available in Next.js (usePathname hook)
- No external packages required

## Success Criteria

- [ ] Copyright text "© 2026 Codenburg" is centered in the footer
- [ ] "Administradores" button is aligned to the right side of the footer
- [ ] Footer is completely hidden when navigating to `/admin/login`
- [ ] Footer displays normally on all other pages including `/admin` (non-login)
- [ ] TypeScript compilation succeeds without errors
- [ ] ESLint passes without new warnings
