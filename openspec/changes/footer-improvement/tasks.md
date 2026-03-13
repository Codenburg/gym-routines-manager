# Tasks: Footer Layout Improvement

## Phase 1: Core Implementation

- [ ] 1.1 Modify `components/footer.tsx`: Add `"use client"` directive at the top of the file
- [ ] 1.2 Modify `components/footer.tsx`: Import `usePathname` from `"next/navigation"`
- [ ] 1.3 Modify `components/footer.tsx`: Add `const pathname = usePathname();` hook after imports
- [ ] 1.4 Modify `components/footer.tsx`: Add conditional return `if (pathname === "/admin/login") return null;` before the JSX return

## Phase 2: Layout Update

- [ ] 2.1 Modify `components/footer.tsx`: Replace `flex flex-col sm:flex-row items-center justify-between` with three-column flexbox structure
- [ ] 2.2 Modify `components/footer.tsx`: Add empty left spacer `<div className="flex-1" />` to push content away from left edge
- [ ] 2.3 Modify `components/footer.tsx`: Wrap copyright in center column with `text-center flex-1` classes
- [ ] 2.4 Modify `components/footer.tsx`: Wrap admin button in right column container `<div className="flex-1 flex justify-end">`

## Phase 3: Verification

- [ ] 3.1 Run TypeScript type check: `npx tsc --noEmit` to verify no compilation errors
- [ ] 3.2 Run ESLint: `npm run lint` to verify no new warnings
- [ ] 3.3 Run production build: `npm run build` to ensure the app builds successfully
- [ ] 3.4 Verify footer centered on `/` route (manual test)
- [ ] 3.5 Verify button aligned right on `/` route (manual test)
- [ ] 3.6 Verify footer hidden on `/admin/login` route (manual test)
- [ ] 3.7 Verify footer visible on `/admin` route (manual test)
- [ ] 3.8 Verify footer visible on `/rutinas` route (manual test)

## Implementation Notes

- The three-column layout uses `flex-1` on left and right columns to ensure the copyright stays centered regardless of button width
- Client-side route detection using `usePathname` is the standard Next.js pattern for client components
- The footer is a simple presentational component; no additional types or interfaces needed

## Dependencies

- No external dependencies required - `usePathname` is built into Next.js
- All changes are isolated to `components/footer.tsx`
