# Proposal: Dark Mode with Mist Theme and Lucide Icons

## Intent

Implement dark/light mode system with consistent Mist theme (zinc palette: dark #09090b, light #ffffff) and replace all ~43 hardcoded SVG icons with lucide-react components. This addresses:
1. Visual accessibility and user preference for dark mode
2. Inconsistent hardcoded SVG icons scattered throughout the codebase
3. No theme persistence across sessions

## Scope

### In Scope
- Dark/light mode toggle with CSS variables (Mist theme - zinc palette)
- Theme store with Zustand + localStorage persistence
- ThemeProvider component and anti-flash script in layout
- ThemeToggle component (sun/moon icons)
- Updated UI components (Card, Button, Input, Textarea) to use CSS variables
- Roboto font integration
- Replace all ~43 hardcoded SVG icons with lucide-react

### Out of Scope
- System preference detection (follow-up)
- Animated theme transitions (follow-up)
- Additional themes beyond Mist (follow-up)

## Approach

Use Tailwind CSS `dark:` variant with CSS variables for theming:
1. Install `lucide-react` package
2. Create CSS variables in global.css for Mist theme (zinc palette)
3. Create Zustand store for theme state with localStorage persistence
4. Create ThemeProvider client component
5. Add anti-flash script to root layout to prevent flash of wrong theme
6. Create ThemeToggle component using lucide-react icons (Sun, Moon)
7. Update all UI components (Card, Button, Input, Textarea) to use CSS variables
8. Add Roboto font via next/font
9. Systematically replace all hardcoded SVG icons with lucide-react equivalents

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modified | Add CSS variables for Mist theme |
| `src/stores/theme-store.ts` | New | Zustand store with localStorage |
| `src/components/theme-provider.tsx` | New | Theme context provider |
| `src/components/theme-toggle.tsx` | New | Dark/light toggle button |
| `src/app/layout.tsx` | Modified | Add font, theme provider, anti-flash |
| `src/components/ui/card.tsx` | Modified | Use CSS variables |
| `src/components/ui/button.tsx` | Modified | Use CSS variables |
| `src/components/ui/input.tsx` | Modified | Use CSS variables |
| `src/components/ui/textarea.tsx` | Modified | Use CSS variables |
| All pages with SVGs | Modified | Replace with lucide-react |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| Flash of unstyled content (FOUC) | High | Add anti-flash script before React hydrates |
| Icon mapping errors | Medium | Test each icon replacement visually |
| CSS variable conflicts | Low | Prefix theme variables with --theme- |
| Bundle size increase | Low | lucide-react treeshakes well |

## Rollback Plan

1. Uninstall lucide-react: `npm uninstall lucide-react`
2. Revert CSS variables in globals.css
3. Remove theme store, ThemeProvider, ThemeToggle
4. Restore hardcoded SVG icons from git history
5. Revert UI component changes

## Dependencies

- `lucide-react` package installation
- Zustand (already installed)

## Success Criteria

- [ ] User can toggle between dark and light mode
- [ ] Theme persists across browser sessions (localStorage)
- [ ] No flash of wrong theme on page load
- [ ] All UI components render correctly in both themes
- [ ] All ~43 hardcoded SVGs replaced with lucide-react
- [ ] No TypeScript or ESLint errors
- [ ] Production build succeeds
