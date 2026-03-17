# UI Specification - Footer Component

## Purpose

This specification defines the requirements and behavior for the application footer component, including layout positioning and conditional visibility based on route.

## Requirements

### Requirement: Copyright Text Centering

The system MUST display the copyright text "© 2026 Codenburg" centered horizontally within the footer container.

#### Scenario: Copyright centered on footer

- GIVEN the user is on any page where the footer is visible
- WHEN the footer component renders
- THEN the text "© 2026 Codenburg" MUST appear in the horizontal center of the footer
- AND the text MUST be visually centered relative to the footer container width

#### Scenario: Copyright centered on different viewport widths

- GIVEN the user is viewing the application on any viewport width (mobile, tablet, desktop)
- WHEN the footer renders
- THEN the copyright text MUST remain horizontally centered regardless of screen size
- AND the centering MUST NOT break or overflow on small screens

---

### Requirement: Admin Button Right Alignment

The system MUST display the "Administradores" button aligned to the right side of the footer container.

#### Scenario: Admin button on right side

- GIVEN the user is on any page where the footer is visible
- WHEN the footer component renders
- THEN the "Administradores" button MUST appear at the right edge of the footer
- AND there MUST be appropriate spacing between the button and the container edge

#### Scenario: Admin button positioning relative to copyright

- GIVEN the footer is rendered with three sections (left spacer, center copyright, right button)
- WHEN the layout is computed
- THEN the copyright text MUST be centered between the left and right sections
- AND the admin button MUST be positioned at the far right

---

### Requirement: Footer Hidden on Admin Login Page

The system MUST NOT render the footer component when the user navigates to the `/admin/login` route.

#### Scenario: Footer hidden on /admin/login

- GIVEN the user navigates to `/admin/login`
- WHEN the page renders
- THEN the footer component MUST NOT be visible
- AND the footer markup MUST NOT be present in the DOM

#### Scenario: Footer visible on other admin routes

- GIVEN the user navigates to `/admin` or any other admin route except `/admin/login`
- WHEN the page renders
- THEN the footer component MUST be visible
- AND display normally with centered copyright and right-aligned button

#### Scenario: Footer visible on public pages

- GIVEN the user navigates to any public route (e.g., `/`, `/rutinas`, `/ejercicios`)
- WHEN the page renders
- THEN the footer component MUST be visible
- AND display with the required centered copyright and right-aligned button

---

### Requirement: Client-Side Route Detection

The system MUST use client-side route detection to determine whether to hide the footer.

#### Scenario: Client component handles route detection

- GIVEN the footer component is converted to a client component
- WHEN the component mounts or the route changes
- THEN the component MUST use `usePathname` from `next/navigation` to detect the current route
- AND MUST return `null` when pathname equals `/admin/login`

---

## Acceptance Criteria

| ID | Criterion | Test Method |
|----|-----------|--------------|
| AC1 | Copyright text "© 2026 Codenburg" is horizontally centered in footer | Visual inspection |
| AC2 | "Administradores" button is aligned to the right edge of footer | Visual inspection |
| AC3 | Footer is completely absent on `/admin/login` page | Navigate to route, verify no footer in DOM |
| AC4 | Footer appears on `/admin` (dashboard) | Navigate to route, verify footer visible |
| AC5 | Footer appears on public pages (e.g., `/`, `/rutinas`) | Navigate to routes, verify footer visible |
| AC6 | TypeScript compiles without errors | Run `npm run build` or `npx tsc --noEmit` |
| AC7 | ESLint passes without new warnings | Run `npm run lint` |
