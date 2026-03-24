# Proposal: Form State Persistence for Routine Creation

## Intent

Users investing time in building complex routines (multi-day, multiple exercises per day) lose all progress when they accidentally close the tab, navigate away, or get logged out. This change introduces automatic localStorage persistence for the routine creation form, so users can resume exactly where they left off without data loss.

**Why this matters**: Losing a half-completed routine with 5 days × 6 exercises each is a terrible UX. This is a classic "resume where you left off" pattern used by Gmail, Google Docs, and every serious form application.

## Scope

### In Scope
- Creation of `usePersistedForm` hook wrapping React Hook Form's `useForm`
- Integration into `rutina-completa-form.tsx` replacing `useState`/`useActionState` hybrid
- localStorage versioning system for forward compatibility
- Debounced persistence (~400ms) using `watch` to avoid excessive writes
- `clear()` method exposed to delete persisted data on successful submit
- Error tolerance: corrupted data, parse failures, missing keys gracefully fall back to defaults
- Zero performance impact: async storage, no blocking reads on mount

### Out of Scope
- Backend changes (no API modifications)
- Migration of other forms to this pattern (single form for this change)
- Cross-tab synchronization
- Encryption of persisted data (not sensitive PII)

## Approach

### Recommended: Option B — Custom `usePersistedForm` Hook

Wrapping `useForm` directly gives us the cleanest integration. We control the persistence lifecycle entirely within the hook.

**Why not Option A (Zustand + useForm)?**
- Zustand persist is designed for state slices, not form state
- Would require bridging Zustand store ↔ React Hook Form state bidirectionally
- More complexity, more potential for sync issues
- Overkill for a single form's needs

**Why Option B wins here:**
- React Hook Form already installed (v7.71.2)
- Direct access to `watch`, `getValues`, `reset` from `useForm`
- Single concern: form state ↔ localStorage
- Cleaner mental model: persistence is an extension of the form, not a separate store

### Hook API Design

```typescript
// Location: src/hooks/use-persisted-form.ts

interface PersistedFormOptions<T> {
  key: string;              // localStorage key, e.g., "rutina-draft-v1"
  defaultValues: T;        // Form's initial values
  version?: number;         // Defaults to 1 — used for migrations
  debounceMs?: number;      // Defaults to 400
}

interface UsePersistedFormReturn<T> {
  // Standard useForm return (subset)
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  getValues: UseFormGetValues<T>;
  reset: UseFormReset<T>;
  formState: UseFormStateReturn<T>;
  
  // Persistence-specific
  clear: () => void;        // Delete from localStorage
  isRestored: boolean;      // True once initial restore completes
}
```

### Storage Key Naming Convention

```
rutina-draft-v1
```
- `rutina-draft` — identifies the form/purpose
- `v1` — version for future migrations
- Pattern: `{form-purpose}-v{version}`

### Versioning Strategy

```typescript
interface PersistedPayload<T> {
  version: number;
  data: T;
  savedAt: string;          // ISO timestamp
}
```

When version mismatches or parse failures occur, discard old data silently and use defaults. Log to console in development only.

### Debounce Implementation

```typescript
// Inside usePersistedForm
const debouncedSave = useMemo(
  () => debounce((data: T) => {
    localStorage.setItem(key, JSON.stringify({
      version,
      data,
      savedAt: new Date().toISOString(),
    }));
  }, debounceMs),
  [key, version, debounceMs]
);

// Watch all values, trigger debounced save
useEffect(() => {
  const subscription = watch((values) => {
    debouncedSave(values as T);
  });
  return () => subscription.unsubscribe();
}, [watch, debouncedSave]);
```

### Error Handling

| Failure Mode | Handling |
|--------------|----------|
| Corrupted JSON | Catch parse error, discard data, use defaults |
| Missing key | `getItem` returns null, use defaults |
| Quota exceeded | Catch `QuotaExceededError`, silently skip save |
| Version mismatch | Compare version, discard if mismatch |
| SSR/hydration mismatch | Check `typeof window !== 'undefined'` before access |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/hooks/use-persisted-form.ts` | **New** | Custom hook (150-200 LOC) |
| `src/components/admin/rutina-completa-form.tsx` | Modified | Replace `useState`/`useActionState` with `usePersistedForm` |
| `src/components/admin/dia-section.tsx` | Modified | May need prop adjustments if form control changes |
| `src/components/admin/ejercicio-row.tsx` | Modified | May need prop adjustments if form control changes |
| `src/lib/schemas.ts` | No change | Already has `RutinaCompletaInput` type |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Data persists across sessions unexpectedly | Low | `clear()` called on successful server submit |
| Stale data conflicts with server validation | Low | Server validation is source of truth; client just aids UX |
| localStorage unavailable (private browsing) | Low | Feature degrades gracefully — form works, just doesn't persist |
| Large form state exceeds storage quota | Low | 7 days × ~20 exercises ≈ <50KB; well under typical 5-10MB limits |

## Rollback Plan

1. Revert `rutina-completa-form.tsx` to previous `useState`/`useActionState` implementation
2. Delete `use-persisted-form.ts`
3. No database/API changes to roll back

**Estimated rollback time**: < 10 minutes

## Dependencies

- `react-hook-form@7.71.2` — already installed
- No new packages required

## Success Criteria

- [ ] Form values persist across page refresh within same browser session
- [ ] Form values persist across tab close/reopen within same browser session
- [ ] Navigating away and returning restores exact form state
- [ ] Successful submission clears persisted data
- [ ] Corrupted localStorage data gracefully falls back to defaults (no crash)
- [ ] No performance regression (debounce prevents excessive writes)
- [ ] TypeScript types are consistent throughout
- [ ] Development console shows no errors related to persistence
