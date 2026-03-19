# Tasks: Admin Panel Quick Wins

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Create `src/components/admin/rutinas-list-client.tsx` — New client component with `useState` for `searchTerm`, receives `rutinas` prop, implements case-insensitive filter on `nombre`, `tipo`, and `descripcion`, renders search input and filtered table
- [x] 1.2 Add `RutinaWithCount` interface (or reuse existing type) to `src/components/admin/rutinas-list-client.tsx` matching the props from page.tsx

## Phase 2: Core Implementation

- [x] 2.1 Add `duplicateRutina` server action to `src/app/actions/rutinas.ts` — Use `prisma.$transaction` to atomically: (1) fetch original rutina with `dias.ejercicios`, (2) create new Rutina with " (Copia)" suffix and new UUID, (3) deep-copy all dias with new UUIDs preserving `orden`, (4) deep-copy all ejercicios preserving `series`, `repes`, `orden`
- [x] 2.2 Modify `src/components/admin/rutinas-list-client.tsx` — Add server action wrapper `handleDuplicate(prevState, formData)` that calls `duplicateRutina` and handles FormState return
- [x] 2.3 Modify `src/components/admin/feriado-manager.tsx` — Replace `bg-zinc-900` with `bg-[var(--button-secondary-bg)]`
- [x] 2.4 Modify `src/components/admin/feriado-manager.tsx` — Replace `text-white`, `text-white/70`, `text-white/50`, `text-white/40`, `text-white/60` with `text-[var(--foreground)]` or `text-[var(--muted-foreground)]` as specified in color mapping
- [x] 2.5 Modify `src/components/admin/feriado-manager.tsx` — Replace `border-white/10` with `border-[var(--card-border)]`
- [x] 2.6 Modify `src/components/admin/feriado-manager.tsx` — Replace `bg-black/50`, `bg-white/5`, `bg-white/20`, `bg-white/50` with `bg-[var(--background)]`
- [x] 2.7 Modify `src/app/(admin)/admin/rutinas/page.tsx` — Add import for `RutinasListClient`, pass `rutinas` array to client component
- [x] 2.8 Modify `src/app/(admin)/admin/rutinas/page.tsx` — Add "Duplicate" column with Copy icon button next to Edit button in the table structure passed to client component
- [x] 2.9 Add cache invalidation to `duplicateRutina` using `revalidatePath("/admin/rutinas")` after successful duplication

## Phase 3: Integration / Wiring

- [x] 3.1 Wire `RutinasListClient` to use `useActionState` or `useFormState` to call `handleDuplicate` server action
- [x] 3.2 Verify search input triggers re-render with filtered results only
- [x] 3.3 Verify duplicate button displays Copy icon from Lucide React (`Copy` or `Copy` icon)

## Phase 4: Testing / Verification

- [ ] 4.1 Write unit test: verify filter logic correctly matches `nombre`, `tipo`, and `descripcion` (case-insensitive)
- [ ] 4.2 Write unit test: verify filter returns empty and shows "No results found" message when no match
- [ ] 4.3 Write integration test: create a rutina with days and exercises, call `duplicateRutina`, verify new rutina has " (Copia)" suffix and all related data copied with new UUIDs
- [ ] 4.4 Visual verification: render FeriadoManager in light mode and dark mode, confirm colors use CSS variables correctly
- [x] 4.5 Run TypeScript compiler to verify no type errors across all modified files
- [x] 4.6 Run ESLint to verify no new warnings

## Phase 5: Cleanup (if needed)

- [ ] 5.1 Remove any unused imports in modified files
- [ ] 5.2 Verify no console.log or debug code left in production files
