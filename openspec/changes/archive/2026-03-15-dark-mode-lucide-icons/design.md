# Design: Dark Mode with Mist Theme and Lucide Icons

## Technical Approach

The implementation uses a CSS variable-based theming system with Zustand for state management and lucide-react for icon替换. The approach leverages Tailwind CSS 4's `@theme inline` feature to map CSS custom properties to Tailwind color utilities, enabling seamless dark/light mode support through class-based theme switching on the HTML root element.

## Architecture Decisions

### Decision: CSS Variables over Tailwind dark: variant

**Choice**: CSS variables with `.light`/`.dark` class on `<html>` element
**Alternatives considered**: Tailwind's built-in `dark:` variant with media query
**Rationale**: Provides explicit control over theme state via JavaScript, enables localStorage persistence, and allows the "dark by default" behavior without relying on system preferences. The Mist theme's dark-first approach aligns better with class-based switching.

### Decision: Zustand over React Context

**Choice**: Zustand store with persist middleware
**Alternatives considered**: React Context + useReducer, Redux Toolkit
**Rationale**: Zustand provides minimal boilerplate with excellent TypeScript support. The persist middleware built into Zustand handles localStorage serialization automatically. Avoids Context API's render-tree issues and is lighter than Redux.

### Decision: Anti-flash script in head

**Choice**: Inline script in `<head>` before React hydrates
**Alternatives considered**: CSS-only approach, useEffect in ThemeProvider
**Rationale**: Ensures the correct theme class is applied BEFORE the first paint, preventing the "flash of wrong theme" (FART). useEffect runs too late and CSS-only cannot read localStorage.

### Decision: Mist theme (zinc palette)

**Choice**: Zinc-based palette with #09090b (dark) and #ffffff (light)
**Alternatives considered**: Blue accent, monochrome with different base colors
**Rationale**: Zinc provides neutral, professional aesthetics suitable for a gym/athletics context. The high contrast in both modes ensures accessibility. "Mist" name reflects the subtle, fog-like gray transitions.

### Decision: lucide-react over Heroicons/FontAwesome

**Choice**: lucide-react for all icons
**Alternatives considered**: Heroicons, React Icons (FontAwesome), custom SVGs
**Rationale**: lucide-react offers excellent tree-shaking, consistent SVG styling, open-source maintenance, and already installed in the project. Provides unified API for all icons.

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Root Layout (Server)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Anti-flash Script (immediate execution)            │    │
│  │  Reads localStorage → adds .light/.dark class      │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ThemeProvider (Client Component)                    │    │
│  │  Subscribes to useThemeStore → syncs class to HTML  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store (Client)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  useThemeStore: { theme, toggleTheme, setTheme }   │    │
│  │  Persisted to localStorage key: "theme-storage"     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ThemeToggle      UI Components    Page Components
   (Sun/Moon)      (Card, Button,   (Using lucide icons)
                    Input, Textarea)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/globals.css` | Modify | Added CSS variables for Mist theme (light/dark), Tailwind @theme inline mappings, Roboto font variable |
| `store/theme-store.ts` | Create | Zustand store with persist middleware for theme state |
| `components/theme-provider.tsx` | Create | Client component that syncs theme state to HTML class |
| `components/theme-toggle.tsx` | Create | Toggle button using lucide-react Sun/Moon icons |
| `app/layout.tsx` | Modify | Added Roboto font via next/font, wrapped with ThemeProvider, added anti-flash script |
| `components/ui/card.tsx` | Modify | Updated to use CSS variables for theming |
| `components/ui/button.tsx` | Modify | Added variants (primary/secondary/danger/ghost), sizes, CSS variable theming |
| `components/ui/input.tsx` | Modify | Updated to use CSS variables, added error state |
| `components/ui/textarea.tsx` | Modify | Updated to use CSS variables, added error state |
| Multiple page components | Modify | Replaced ~43 hardcoded SVGs with lucide-react equivalents |

## Interfaces / Contracts

### Theme State Type
```typescript
export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
}

interface ThemeActions {
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}
```

### ThemeStore API
```typescript
const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set) => ({
      theme: "dark", // Default theme
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "theme-storage" } // localStorage key
  )
);
```

### CSS Variables Contract (Dark Theme - :root)
```css
--background: #09090b;
--foreground: #fafafa;
--card: #18181b;
--card-foreground: #fafafa;
--primary: #fafafa;
--primary-foreground: #18181b;
--secondary: #27272a;
--secondary-foreground: #fafafa;
--muted: #27272a;
--muted-foreground: #a1a1aa;
--accent: #27272a;
--accent-foreground: #fafafa;
--destructive: #7f1d1d;
--destructive-foreground: #fafafa;
--border: #27272a;
--input: #27272a;
--ring: #d4d4d8;
/* Component-specific */
--card-bg: #18181b;
--card-border: #27272a;
--input-bg: #18181b;
--input-border: #27272a;
--input-foreground: #fafafa;
--input-placeholder: #71717a;
--button-primary-bg: #fafafa;
--button-primary-foreground: #18181b;
--button-secondary-bg: #27272a;
--button-secondary-foreground: #fafafa;
--button-secondary-border: #3f3f46;
```

### Button Component API
```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}
```

### Input/Textarea Component API
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | ThemeStore state transitions | Test toggleTheme, setTheme, persist hydration |
| Unit | ThemeToggle click behavior | Test icon swap, aria-label update |
| Integration | ThemeProvider class sync | Verify .dark/.light class applied to HTML |
| Integration | UI components with CSS vars | Visual regression testing |
| E2E | Full theme toggle flow | Playwright: click toggle → verify localStorage → reload → verify persistence |
| E2E | Anti-flash script | Verify no theme flash on initial load |

## Migration / Rollout

No migration required. This is a net-new feature that doesn't replace existing functionality. The implementation follows a progressive enhancement approach:

1. CSS variables provide defaults even without JavaScript
2. Anti-flash script ensures no visual regression
3. localStorage provides backward compatibility for returning users

## Open Questions

- [ ] System preference detection (media query) - deferred to follow-up
- [ ] Theme transition animations - deferred to follow-up
- [ ] Additional themes (e.g., "Midnight" with blue accent) - deferred to follow-up