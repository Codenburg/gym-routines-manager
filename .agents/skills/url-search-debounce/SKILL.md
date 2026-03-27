---
name: url-search-debounce
description: >
  Implements URL-based search with dual-state pattern (local input + debounced URL).
  Trigger: When implementing search/filter with URL as source of truth and debounced updates.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Search input that updates URL without server re-renders on every keystroke
- Filters that preserve other query params (pagination, etc.)
- State that needs to survive browser back/forward navigation
- When you need idempotent URL updates (same state = same URL)

## Critical Patterns

### ARCHITECTURE: Dual State Pattern

```
User types → setInputValue (immediate) → debounce → router.replace() → URL
                                    ↓
                           prevUrlRef comparison → idempotent?
```

**NEVER write to URL from useEffect** - that creates loops.

### STATE SEPARATION

| State | Source | Update |
|-------|--------|--------|
| `inputValue` | Local useState | Immediate on keystroke |
| `query` | URL searchParams | After debounce |
| `trainerFilters` | URL searchParams | Immediate |

### REQUIRED GUARDS (5)

1. **Idempotency**: `prevUrlRef` stores last written URL. Skip if `newUrl === prevUrlRef`
2. **Cancelation**: `cancelDebounce()` before every URL-write operation
3. **Mount guard**: `isMountedRef.current` check inside timeout callback
4. **Sync guard**: Navigation detection via `prevUrlRef` diff
5. **Stable serialization**: `.sort()` before `.join()` for arrays

### PRESERVE OTHER PARAMS

```typescript
// ✅ CORRECT - clone existing params
const params = new URLSearchParams(searchParams.toString());

// ❌ WRONG - loses other params
const params = new URLSearchParams();
```

### NORMALIZATION POLICY

- `trim()` only for deciding whether to delete
- Persist value raw (with spaces)

```typescript
if (inputValue.trim()) {
  params.set("search", inputValue); // Persist raw
} else {
  params.delete("search"); // Delete if empty/whitespace
}
```

## Code Examples

### useUnifiedSearch Hook (Complete)

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_DELAY = 300;

export function useUnifiedSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // LOCAL: immediate UI response
  const [inputValue, setInputValueState] = useState(searchParams.get("search") ?? "");

  // REFS for async safety
  const isMountedRef = useRef(true);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUrlRef = useRef(searchParams.toString());
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;

  // DERIVED from URL (not state)
  const query = searchParams.get("search") ?? "";
  
  const trainerFilters = (() => {
    const trainersParam = searchParams.get("trainers");
    if (trainersParam) {
      return trainersParam.split(",").map(t => t.trim()).filter(t => t.length > 0).sort();
    }
    return [];
  })();

  // ───────────────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────────────

  const buildParams = useCallback((searchToSet: string, trainersToSet: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchToSet.trim()) {
      params.set("search", searchToSet);
    } else {
      params.delete("search");
    }

    if (trainersToSet.length > 0) {
      params.set("trainers", [...trainersToSet].sort().join(","));
    } else {
      params.delete("trainers");
    }
    
    return params;
  }, [searchParams]);

  const executeReplace = useCallback((params: URLSearchParams): boolean => {
    const newUrl = params.toString();
    if (newUrl === prevUrlRef.current) return false; // Idempotent
    router.replace(`?${newUrl}`, { scroll: false });
    prevUrlRef.current = newUrl;
    return true;
  }, [router]);

  const cancelDebounce = useCallback(() => {
    if (debounceTimeoutRef.current !== null) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  // ───────────────────────────────────────────────────────────────
  // CLEANUP
  // ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cancelDebounce();
    };
  }, [cancelDebounce]);

  // ───────────────────────────────────────────────────────────────
  // SYNC: External navigation (back/forward)
  // ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const currentUrl = searchParams.toString();
    if (currentUrl === prevUrlRef.current) return; // No external change

    cancelDebounce(); // Cancel any pending debounce
    const urlSearch = searchParams.get("search") ?? "";
    setInputValueState(urlSearch);
    inputValueRef.current = urlSearch;
    prevUrlRef.current = currentUrl;
  }, [searchParams, cancelDebounce]);

  // ───────────────────────────────────────────────────────────────
  // SET INPUT: Local update + debounced URL update
  // ───────────────────────────────────────────────────────────────

  const setInputValue = useCallback((value: string) => {
    setInputValueState(value);
    inputValueRef.current = value;
    cancelDebounce();

    debounceTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      const params = buildParams(value, trainerFilters);
      executeReplace(params);
      debounceTimeoutRef.current = null;
    }, DEBOUNCE_DELAY);
  }, [cancelDebounce, buildParams, trainerFilters, executeReplace]);

  // ───────────────────────────────────────────────────────────────
  // HANDLERS: Immediate (no debounce for filters)
  // ───────────────────────────────────────────────────────────────

  const toggleTrainerFilter = useCallback((name: string) => {
    cancelDebounce();
    const newFilters = trainerFilters.includes(name)
      ? trainerFilters.filter(t => t !== name)
      : [...trainerFilters, name];
    executeReplace(buildParams(query, newFilters));
  }, [trainerFilters, query, buildParams, executeReplace, cancelDebounce]);

  const clearInput = useCallback(() => {
    cancelDebounce();
    setInputValueState("");
    inputValueRef.current = "";
    executeReplace(buildParams("", trainerFilters));
  }, [trainerFilters, buildParams, executeReplace, cancelDebounce]);

  return {
    inputValue,    // LOCAL - for UI
    setInputValue, // Updates local + schedules debounce
    query,         // DERIVED from URL
    trainerFilters, // DERIVED from URL
    toggleTrainerFilter,
    clearInput,
  };
}
```

### SearchBar Component

```tsx
"use client";

import { SearchInput } from "./search-input";
import { useUnifiedSearch } from "@/hooks/use-unified-search";

export function SearchBar() {
  const { inputValue, setInputValue, clearInput } = useUnifiedSearch();

  return (
    <SearchInput
      value={inputValue}      // Local state - immediate
      onChange={setInputValue} // Updates local + debounce URL
      onClear={clearInput}     // Immediate clear
    />
  );
}
```

### SearchInput Component (with onClear)

```tsx
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void; // Separate clear handler
}

export function SearchInput({ value, onChange, onClear }: SearchInputProps) {
  return (
    <div className="relative">
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button onClick={onClear || (() => onChange(""))}>
          Clear
        </button>
      )}
    </div>
  );
}
```

## Anti-Patterns

### ❌ DON'T: Write to URL in useEffect

```typescript
// ❌ Creates infinite loop
useEffect(() => {
  router.push(`?search=${query}`);
}, [query]);

// ❌ Creates loop - searchParams changes trigger effect
useEffect(() => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("search", query);
  router.replace(`?${params.toString()}`);
}, [query, searchParams]);
```

### ❌ DON'T: Build params without cloning

```typescript
// ❌ Loses other params like page, limit
const params = new URLSearchParams();
params.set("search", value);
```

### ❌ DON'T: Join without sort

```typescript
// ❌ Non-deterministic order
params.set("trainers", trainers.join(","));

// ✅ Stable order
params.set("trainers", [...trainers].sort().join(","));
```

## Decision Tree

```
Need to update URL on user input?
├── YES → Use setInputValue (debounced)
│         └── Hook handles cleanup
└── NO → Need immediate URL update?
    ├── YES → Use executeReplace directly
    └── NO → Just update local state
```

## Files Structure

```
src/
├── hooks/
│   └── use-unified-search.ts    # The hook
├── components/
│   └── search/
│       ├── search-bar.tsx       # Uses inputValue
│       └── search-input.tsx     # Has onClear prop
└── app/
    └── page.tsx                # Server Component reads searchParams
```

## Resources

- **Implementation**: See [use-unified-search.ts](src/hooks/use-unified-search.ts) for complete example
- **Next.js routing**: [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
