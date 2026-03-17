# Delta for Admin Panel

## ADDED Requirements

### Requirement: Admin Profile Header Component

The admin header MUST display a profile button on the right side showing the authenticated admin's name with a User icon. The profile button MUST open a dropdown menu when clicked.

The system SHALL display the admin's name from the session data.

#### Scenario: Profile button displays admin name

- GIVEN an authenticated admin is on any admin panel page
- WHEN the header renders
- THEN a profile button MUST be visible on the right side of the header
- AND the button MUST display the User icon from lucide-react
- AND the button MUST display the admin's name from `session.user.name`

#### Scenario: Profile dropdown opens on click

- GIVEN an authenticated admin is on any admin panel page
- AND the profile dropdown is closed
- WHEN the admin clicks the profile button
- THEN the dropdown MUST open
- AND the dropdown MUST be aligned to the right edge of the profile button
- AND the button MUST show aria-expanded="true"

#### Scenario: Profile dropdown closes on click outside

- GIVEN an authenticated admin has the profile dropdown open
- WHEN the admin clicks anywhere outside the dropdown
- THEN the dropdown MUST close
- AND the profile button MUST show aria-expanded="false"

#### Scenario: Profile dropdown closes on Escape key

- GIVEN an authenticated admin has the profile dropdown open
- WHEN the admin presses the Escape key
- THEN the dropdown MUST close
- AND the profile button MUST regain focus
- AND the button MUST show aria-expanded="false"

#### Scenario: Profile button has correct accessible attributes

- GIVEN an authenticated admin is on any admin panel page
- WHEN the profile button is rendered
- THEN the button MUST have aria-expanded attribute reflecting open/closed state
- AND the button MUST have aria-haspopup="true"
- AND the dropdown MUST have role="menu"

---

### Requirement: Logout Functionality

The dropdown menu MUST provide a "Cerrar sesión" option that, when clicked, MUST clear the session and redirect the user to the login page.

The system SHALL use the existing signOut function from `@/lib/auth-client`.

#### Scenario: Logout option visible in dropdown

- GIVEN an authenticated admin has the profile dropdown open
- WHEN the dropdown renders
- THEN a "Cerrar sesión" option MUST be visible
- AND it SHOULD include a LogOut icon

#### Scenario: Logout clears session and redirects

- GIVEN an authenticated admin has the profile dropdown open
- WHEN the admin clicks "Cerrar sesión"
- THEN the session MUST be cleared (token removed)
- AND the admin MUST be redirected to /admin/login
- AND the admin MUST NOT be able to access admin pages without re-authenticating

---

### Requirement: Visual States

The profile button and dropdown options MUST have visible hover and active states for better user experience.

The system SHOULD use consistent button styling with the existing shadcn/ui Button component.

#### Scenario: Profile button hover state

- GIVEN an authenticated admin hovers over the profile button
- THEN a visual hover state MUST be visible (background color change or similar)

#### Scenario: Logout option hover state

- GIVEN an authenticated admin hovers over "Cerrar sesión" in the dropdown
- THEN a visual hover state MUST be visible
- AND the cursor MUST be pointer

---

### Requirement: Dropdown Alignment

The dropdown menu MUST be positioned aligned to the profile button, appearing directly below it with proper spacing.

The dropdown SHALL NOT overflow the viewport.

#### Scenario: Dropdown aligns to button

- GIVEN an authenticated admin opens the profile dropdown
- WHEN the dropdown renders
- THEN the dropdown's left edge MUST align with the profile button's left edge
- OR the dropdown's right edge MUST align with the profile button's right edge (right-aligned)

---

### Requirement: Session Data Fallback

If session data is unavailable or admin name is not set, the system SHALL display a fallback value or hide the name gracefully.

#### Scenario: No admin name in session

- GIVEN an authenticated admin is on the admin panel
- AND session.user.name is undefined or empty
- WHEN the header renders
- THEN the profile button SHOULD display a fallback (e.g., "Admin" or just the User icon)
- AND the application MUST NOT crash

---

## Technical Notes

This requirement adds new UI components to the AdminLayout header:
- Profile button with User icon and admin name
- Dropdown menu with LogOut icon and "Cerrar sesión" option
- Dropdown positioning and alignment logic
- Keyboard and click-outside handlers
- Accessibility attributes (aria-expanded, aria-haspopup, role="menu")

The implementation uses React state (useState, useEffect, useRef) for dropdown behavior.
