# Technical Design: rediseño-home-mobile-first

## 1. Concept & Vision

Redesign the public home page `/` to prioritize mobile users as first-class citizens. The current desktop-heavy layout with a persistent TrainerSidebar creates poor mobile UX. The redesign introduces a mobile-first approach: move trainer filtering into a Sheet-based bottom drawer, convert Info/Feriados navigation into a fixed bottom bar, simplify the RoutineCard by removing author attribution, and strip the header down to essentials. Desktop (`lg+`) retains trainer pills but repositioned into the main content area, replacing the sidebar paradigm.

## 2. Design Language

### Aesthetic Direction
Clean, utilitarian gym aesthetic. High contrast for readability during workouts. Minimal chrome, maximum content density on mobile.

### Color Palette
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` | `#ffffff` | `#09090b` | Page background |
| `foreground` | `#09090b` | `#fafafa` | Primary text |
| `card` | `#ffffff` | `#18181b` | RoutineCard bg |
| `card-foreground` | `#09090b` | `#fafafa` | Card text |
| `primary` | `#09090b` | `#fafafa` | Buttons, active states |
| `primary-foreground` | `#fafafa` | `#09090b` | Button text |
| `muted` | `#f4f4f5` | `#27272a` | Secondary backgrounds |
| `muted-foreground` | `#71717a` | `#a1a1aa` | Secondary text |
| `border` | `#e4e4e7` | `#27272a` | Dividers, card borders |
| `ring` | `#09090b` | `#fafafa` | Focus rings |

### Typography
- **Font**: `Geist` (Next.js default) via `next/font`
- **Scale**: `text-sm` for metadata, `text-base` for body, `text-lg` for card titles, `text-2xl` for page title
- **Weight**: `font-medium` for labels, `font-semibold` for titles

### Spatial System
- Base unit: `4px` (Tailwind default)
- Component padding: `p-3` for cards, `p-4` for sections
- Grid gap: `gap-4` for routine grid
- Bottom bar height: `64px` (accounts for `pb-16` on grid)

### Motion Philosophy
- Sheet open/close: Radix UI default (200ms ease-out)
- Hover states: `150ms` transitions on interactive elements
- No gratuitous animations — gym users need speed, not flair

### Visual Assets
- **Icons**: Lucide React (already in use via shadcn)
- **Badges**: shadcn `Badge` variant for routine types
- No decorative images on home page

---

## 3. Layout & Structure

### Mobile (`< lg`)

```
┌─────────────────────────────┐
│  Header                     │
│  [Title]            [Theme] │
├─────────────────────────────┤
│  SearchSection              │
│  [SearchBar] [Filtrar●]     │
├─────────────────────────────┤
│                             │
│  RoutineGrid (pb-16)        │
│  ┌─────────┐ ┌─────────┐    │
│  │ Routine │ │ Routine │    │
│  │  Card   │ │  Card   │    │
│  └─────────┘ └─────────┘    │
│  ┌─────────┐ ┌─────────┐    │
│  │ Routine │ │ Routine │    │
│  └─────────┘ └─────────┘    │
│                             │
├─────────────────────────────┤
│  BottomBar (fixed)          │
│  [Info]        [Feriados]   │
└─────────────────────────────┘
```

### Desktop (`lg+`)

```
┌──────────────────────────────────────────────────┐
│  Header                                          │
│  [Title]                            [Theme] [Nav] │
├──────────────────────────────────────────────────┤
│  ┌───────────┐  ┌────────────────────────────┐  │
│  │  Trainer  │  │  SearchSection              │  │
│  │   Pills   │  │  [SearchBar]     [Info][●] │  │
│  │           │  ├────────────────────────────┤  │
│  │  [Trainer]│  │                            │  │
│  │  [Trainer]│  │  RoutineGrid               │  │
│  │  [Trainer]│  │  ┌────┐ ┌────┐ ┌────┐     │  │
│  │           │  │  │Card│ │Card│ │Card│     │  │
│  └───────────┘  │  └────┘ └────┘ └────┘     │  │
│                  └────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Responsive Breakpoints
- Mobile: `< lg` (1024px)
- Desktop: `lg+`

---

## 4. Component Inventory

### 4.1 TrainerFilterDrawer (NEW)

**File**: `src/components/search/trainer-filter-drawer.tsx`

**Type**: Client Component

**Props**:
```typescript
interface TrainerFilterDrawerProps {
  trainers: Trainer[];
  currentFilters: string[];
  onToggle: (trainerId: string) => void;
}
```

**Structure**:
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline" size="sm" className="gap-2">
      <FilterIcon className="h-4 w-4" />
      Filtrar
      {currentFilters.length > 0 && (
        <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
          {currentFilters.length}
        </Badge>
      )}
    </Button>
  </SheetTrigger>
  <SheetContent side="bottom" className="h-[70vh]">
    <SheetHeader>
      <SheetTitle>Filtrar por Entrenador</SheetTitle>
    </SheetHeader>
    <ScrollArea className="h-full mt-4">
      <div className="flex flex-wrap gap-2 p-1">
        {trainers.map(trainer => (
          <Pill
            key={trainer.id}
            trainer={trainer}
            isActive={currentFilters.includes(trainer.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </ScrollArea>
  </SheetContent>
</Sheet>
```

**States**:
| State | Visual |
|-------|--------|
| Closed | Button shows "Filtrar" with optional badge count |
| Open | Sheet slides up from bottom, 70vh height |
| With active filters | Badge shows count, active pills highlighted |

**Theme**: Uses `bg-background`, `text-foreground`, `border-border`, `hover:bg-accent`

---

### 4.2 BottomBar (NEW)

**File**: `src/components/layout/bottom-bar.tsx`

**Type**: Client Component

**Props**: None (reads from navigation)

**Structure**:
```tsx
export function BottomBar() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background lg:hidden">
      <Link
        href="/informacion"
        className={cn(
          "flex flex-col items-center gap-1 p-2",
          pathname === "/informacion" && "text-primary"
        )}
      >
        <InfoIcon className="h-5 w-5" />
        <span className="text-xs">Información</span>
      </Link>
      
      <Link
        href="/feriados"
        className={cn(
          "flex flex-col items-center gap-1 p-2",
          pathname === "/feriados" && "text-primary"
        )}
      >
        <CalendarIcon className="h-5 w-5" />
        <span className="text-xs">Feriados</span>
      </Link>
    </nav>
  );
}
```

**Visibility**: `hidden lg:flex` — only visible on mobile

**States**:
| State | Visual |
|-------|--------|
| Default | Both links visible, icon + label |
| Active route | `text-primary` highlight |
| Hover | `hover:bg-accent` background |

**Theme**: Uses `bg-background`, `border-t`, `text-foreground`, `hover:bg-accent`

---

### 4.3 RoutineCard (MODIFIED)

**File**: `src/components/routines/routine-card.tsx`

**Changes**: Remove "Creado por X" line

**Before**:
```
┌────────────────────────────┐
│ Title                      │
│ [Tipo Badge]               │
│ Description text...        │
│ Creado por TrainerName     │
│ [Mon] [Tue] [Wed]...       │
└────────────────────────────┘
```

**After**:
```
┌────────────────────────────┐
│ Title                      │
│ [Tipo Badge]               │
│ Description text...         │
│ [Mon] [Tue] [Wed]...       │
└────────────────────────────┘
```

**Implementation**: Remove the flex row containing `Creado por` text. Keep everything else identical.

---

### 4.4 page.tsx (MODIFIED)

**File**: `src/app/(public)/page.tsx`

**Changes**:
1. Remove subtitle from `HeaderSection`
2. Remove `TrainerSidebar` import and usage
3. Add `TrainerFilterDrawer` for mobile
4. Add `BottomBar` at page bottom (mobile only)
5. Wrap routine grid in responsive container

**Before**:
```tsx
<HeaderSection 
  title="Gimnasio Routines"
  subtitle="Encuentra tu rutina ideal"
/>
<TrainerSidebar trainers={trainers} />
<SearchSection />
<RoutineGrid routines={routines} />
```

**After**:
```tsx
<HeaderSection title="Gimnasio Routines" />
<div className="flex flex-col lg:flex-row">
  {/* Desktop only trainer pills */}
  <aside className="hidden lg:block w-64 p-4">
    <TrainerPills trainers={trainers} />
  </aside>
  
  <main className="flex-1">
    <SearchSection>
      {/* Mobile filter trigger */}
      <div className="lg:hidden">
        <TrainerFilterDrawer trainers={trainers} ... />
      </div>
    </SearchSection>
    <RoutineGrid routines={routines} className="pb-16 lg:pb-0" />
  </main>
</div>
<BottomBar />
```

---

### 4.5 TrainerSidebar → TrainerPills (MODIFIED/RENAMED)

**File**: `src/components/search/trainer-pills.tsx` (renamed from `trainer-sidebar.tsx`)

**Changes**:
- Desktop: renders as left sidebar pills
- Mobile: component hidden, logic moves to `TrainerFilterDrawer`
- Component now exports `TrainerPills` instead of `TrainerSidebar`

**Structure**:
```tsx
export function TrainerPills({ trainers, currentFilters, onToggle }: TrainerPillsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Filtrar por Entrenador
      </h2>
      <div className="flex flex-wrap gap-2">
        {trainers.map(trainer => (
          <Pill
            key={trainer.id}
            trainer={trainer}
            isActive={currentFilters.includes(trainer.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### 4.6 SearchSection (MODIFIED)

**File**: `src/components/search/search-section.tsx`

**Changes**:
- Desktop: Info and Feriados as icon-only links in header area
- Mobile: Filter button appears, Info/Feriados move to BottomBar

**Desktop Structure**:
```tsx
<div className="flex items-center justify-between">
  <SearchBar />
  <div className="flex items-center gap-2">
    <Link href="/informacion" className="p-2 hover:bg-accent rounded">
      <InfoIcon className="h-4 w-4" />
    </Link>
    <Link href="/feriados" className="p-2 hover:bg-accent rounded">
      <CalendarIcon className="h-4 w-4" />
    </Link>
    {/* Existing trainer filter elements */}
  </div>
</div>
```

**Mobile**: Filter button only (TrainerFilterDrawer handles trainer selection)

---

## 5. Technical Approach

### Framework & Architecture
- **Framework**: Next.js 16 App Router
- **Component Pattern**: Server Components by default, `use client` only when needed
- **State Management**: URL search params for trainer filters via `useUnifiedSearch()` hook
- **Styling**: Tailwind CSS 4 with CSS var tokens

### Key Dependencies
- `npx shadcn@latest add sheet` — Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle
- `@radix-ui/react-dialog` — peer dependency for Sheet
- `lucide-react` — icons (already present)

### State Management Detail

**Trainer Filter State**:
```typescript
// useUnifiedSearch hook handles URL params
const { searchParams, router } = useUnifiedSearch();
const activeTrainers = searchParams.get("trainers")?.split(",").filter(Boolean) ?? [];

// Toggle handler
const handleToggleTrainer = (trainerId: string) => {
  const newFilters = activeTrainers.includes(trainerId)
    ? activeTrainers.filter(id => id !== trainerId)
    : [...activeTrainers, trainerId];
  
  const params = new URLSearchParams(searchParams);
  if (newFilters.length > 0) {
    params.set("trainers", newFilters.join(","));
  } else {
    params.delete("trainers");
  }
  
  router.replace(`?${params.toString()}`);
};
```

### File Structure
```
src/
├── app/
│   ├── (public)/
│   │   └── page.tsx                 # MODIFIED
│   └── globals.css                  # MODIFIED (if needed)
├── components/
│   ├── layout/
│   │   └── bottom-bar.tsx           # NEW
│   ├── routines/
│   │   └── routine-card.tsx         # MODIFIED
│   └── search/
│       ├── trainer-filter-drawer.tsx # NEW
│       ├── trainer-pills.tsx         # RENAMED from trainer-sidebar
│       └── search-section.tsx        # MODIFIED
```

### Theme Audit Checklist
All modified/new components MUST use:
- [ ] `bg-background` instead of `bg-white`/`bg-slate-50`
- [ ] `bg-card` instead of `bg-white` for cards
- [ ] `text-foreground` instead of `text-slate-900`
- [ ] `text-muted-foreground` instead of `text-slate-500`
- [ ] `border-border` instead of `border-slate-200`
- [ ] `hover:bg-accent` instead of `hover:bg-slate-100`
- [ ] `focus:ring-ring` for focus states

Forbidden in new code: `bg-slate-*`, `text-slate-*`, `border-slate-*`

---

## 6. Sequence Diagrams

### Mobile Trainer Filter Flow

```
┌──────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User    │     │ TrainerFilter   │     │   Router/       │
│          │     │ Drawer          │     │   useUnifiedSearch │
│          │     │                 │     │                 │
│ Tap      │────▶│ (Sheet opens)   │     │                 │
│ Filtrar  │     │                 │     │                 │
│          │     │                 │     │                 │
│ Tap      │────▶│ onToggle(id)    │────▶│ searchParams    │
│ Trainer  │     │                 │     │ update          │
│ Pill     │     │                 │     │                 │
│          │     │                 │     │ router.replace  │
│          │     │                 │     │ (?trainers=...) │
│          │     │                 │     │                 │
│          │◀────│ Sheet closes    │◀────│ returns         │
│          │     │                 │     │                 │
│ See      │────▶│ RoutineGrid     │     │                 │
│ filtered │     │ re-renders      │     │                 │
│ results  │     │                 │     │                 │
└──────────┘     └─────────────────┘     └─────────────────┘
```

### Info/Feriados Bottom Bar (Mobile)

```
┌──────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User    │     │   BottomBar     │     │    Router       │
│          │     │                 │     │                 │
│ On mobile│     │ (fixed at       │     │                 │
│ home     │     │  bottom)        │     │                 │
│          │     │                 │     │                 │
│ Tap      │────▶│ Link to         │────▶│ navigate to     │
│ Info     │     │ /informacion    │     │ /informacion    │
│          │     │                 │     │                 │
│ Tap      │────▶│ Link to         │────▶│ navigate to     │
│ Feriados │     │ /feriados       │     │ /feriados       │
│          │     │                 │     │                 │
└──────────┘     └─────────────────┘     └─────────────────┘
```

---

## 7. Implementation Order

1. **Install shadcn Sheet** — `npx shadcn@latest add sheet`
2. **Create TrainerFilterDrawer** — new component, mobile filter trigger
3. **Create BottomBar** — new component, mobile nav
4. **Modify RoutineCard** — remove "Creado por X"
5. **Rename TrainerSidebar → TrainerPills** — remove desktop-only wrapper logic
6. **Modify SearchSection** — add desktop Info/Feriados links
7. **Modify page.tsx** — integrate all components, mobile-first layout
8. **Theme audit** — verify all components use CSS var tokens
9. **Test** — verify light/dark mode, mobile/desktop layouts

---

## 8. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| shadcn sheet install adds unexpected deps | Low | Abort and document if peer deps conflict |
| Bottom bar padding overlaps routine grid | Medium | Add `pb-16` to grid container on mobile |
| Theme hardcoding in existing sidebar | Medium | Audit tokens before implementing |
| Trainer pills state sync between mobile drawer and desktop | Medium | Both read from URL params via `useUnifiedSearch` |

---

## 9. Success Criteria

- [ ] Mobile "Filtrar" button opens trainer bottom drawer
- [ ] Trainer pills selectable in drawer, URL updates
- [ ] Info/Feriados appear as fixed bottom bar on mobile (`< lg`)
- [ ] Info/Feriados appear as icon links in SearchSection header on desktop (`lg+`)
- [ ] RoutineCard no longer shows "Creado por X"
- [ ] Header shows only title + ThemeToggle (no subtitle)
- [ ] TrainerPills visible in sidebar area on desktop
- [ ] All affected components render correctly in light AND dark mode
- [ ] No hardcoded `slate-*` colors in new/modified components