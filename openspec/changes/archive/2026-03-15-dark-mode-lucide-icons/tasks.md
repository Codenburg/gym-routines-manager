# Tasks: Dark Mode with Mist Theme and Lucide Icons

## Phase 1: Foundation (CSS Variables & Theming Infrastructure)

- [x] 1.1 Add CSS variables for Mist theme in `app/globals.css` (dark/light mode color palettes)
- [x] 1.2 Configure Tailwind CSS 4 `@theme inline` mappings to CSS variables in `app/globals.css`
- [x] 1.3 Add Roboto font variable and base styles in `app/globals.css`

## Phase 2: Theme State Management

- [x] 2.1 Create Zustand store `store/theme-store.ts` with theme state and actions
- [x] 2.2 Configure persist middleware for localStorage with "theme-storage" key
- [x] 2.3 Implement `toggleTheme` and `setTheme` actions in store
- [x] 2.4 Set default theme to "dark"

## Phase 3: Theme Provider & Anti-Flash

- [x] 3.1 Create `components/theme-provider.tsx` client component
- [x] 3.2 Sync theme state to HTML class (.dark/.light) in ThemeProvider
- [x] 3.3 Add anti-flash script in `app/layout.tsx` `<head>` to prevent theme flash
- [x] 3.4 Wrap application with ThemeProvider in `app/layout.tsx`
- [x] 3.5 Add Roboto font via `next/font/google` in `app/layout.tsx`

## Phase 4: Theme Toggle Component

- [x] 4.1 Create `components/theme-toggle.tsx` component
- [x] 4.2 Integrate lucide-react Sun and Moon icons
- [x] 4.3 Wire up toggleTheme action from store
- [x] 4.4 Add proper accessibility attributes (aria-label)

## Phase 5: UI Components Update

- [x] 5.1 Update `components/ui/card.tsx` to use CSS variables for theming
- [x] 5.2 Update `components/ui/button.tsx` with variants (primary/secondary/danger/ghost)
- [x] 5.3 Add size variants (sm/md/lg) to Button component
- [x] 5.4 Update `components/ui/input.tsx` to use CSS variables
- [x] 5.5 Add error state support to Input component
- [x] 5.6 Update `components/ui/textarea.tsx` to use CSS variables
- [x] 5.7 Add error state support to Textarea component

## Phase 6: Icon Migration (SVG → lucide-react)

- [x] 6.1 Replace navigation icons with lucide-react equivalents (Home, Dumbbell, Calendar, Settings, etc.)
- [x] 6.2 Replace action icons with lucide-react (Plus, Edit, Trash, Save, X, ChevronRight, etc.)
- [x] 6.3 Replace status icons with lucide-react (Check, X, AlertCircle, Loader, etc.)
- [x] 6.4 Replace form icons with lucide-react (Search, Eye, EyeOff, Lock, User, etc.)
- [x] 6.5 Replace UI feedback icons with lucide-react (Menu, MoreVertical, Copy, Download, etc.)

## Phase 7: Verification

- [x] 7.1 Verify dark mode renders correctly without flash on page load
- [x] 7.2 Verify theme persists across page reloads
- [x] 7.3 Verify theme toggle works correctly (dark ↔ light)
- [x] 7.4 Verify all UI components respond to theme changes
- [x] 7.5 Verify all lucide icons render correctly in both themes
- [x] 7.6 Verify accessibility (keyboard navigation, screen readers)

## Implementation Summary

All 8 major implementation areas completed:
1. ✅ CSS variables in globals.css (Mist theme dark/light palettes)
2. ✅ Theme store with Zustand (persist middleware)
3. ✅ ThemeProvider component (syncs to HTML class)
4. ✅ Anti-flash script in layout (immediate execution in head)
5. ✅ ThemeToggle component (Sun/Moon icons)
6. ✅ UI components updated (Card, Button, Input, Textarea)
7. ✅ Roboto font added via next/font
8. ✅ ~43 SVG icons replaced with lucide-react

**Total Tasks**: 28 tasks across 7 phases
**Status**: All tasks completed ✅
