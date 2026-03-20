# Delta for feedback

## Purpose

This spec defines the user feedback requirements for the admin panel UI refactor, covering toast notifications, loading states, empty states, and error handling patterns.

---

## ADDED Requirements

### Requirement: Toast Notification System

The system MUST use `toast.promise()` from `sonner` for ALL mutation feedback. The system MUST completely eliminate `window.alert`, `window.confirm`, and `console.error` for user-facing feedback.

All server action mutations MUST follow this pattern:

```typescript
const promise = serverAction(formData);
toast.promise(promise, {
  loading: "Mensaje de carga...",
  success: (result) => "Mensaje de éxito",
  error: (err) => err.message || "Mensaje de error"
});
```

#### Scenario: Successful create shows success toast

- GIVEN an admin creates a new rutina
- WHEN the createRutina server action succeeds
- THEN a success toast MUST display: "Rutina creada exitosamente"
- AND the toast MUST appear immediately after success

#### Scenario: Failed create shows error toast

- GIVEN an admin creates a rutina with invalid data
- WHEN the createRutina server action returns an error
- THEN an error toast MUST display with the error message
- AND the error message MUST be user-friendly (not technical)

#### Scenario: Bulk delete shows count in toast

- GIVEN an admin deletes 5 selected rutinas
- WHEN the deleteRutinas server action succeeds
- THEN the success toast MUST display: "5 rutinas eliminadas"
- AND MUST include the count of deleted items

#### Scenario: Duplicate routine shows success toast

- GIVEN an admin duplicates a routine
- WHEN the duplicateRutina server action succeeds
- THEN a success toast MUST display: "Rutina duplicada exitosamente"

#### Scenario: Delete single item shows success toast

- GIVEN an admin deletes a single item (feriado, día, ejercicio)
- WHEN the delete server action succeeds
- THEN a success toast MUST display: "[Item] eliminado exitosamente"

#### Scenario: Server error shows error toast

- GIVEN a server action fails due to infrastructure error
- WHEN the error is caught
- THEN an error toast MUST display: "Error al realizar la operación. Intenta de nuevo."
- AND the original error message SHOULD be logged server-side only

#### Scenario: NO window.alert used

- GIVEN any admin component is written or refactored
- WHEN code is reviewed
- THEN `window.alert` MUST NOT appear in any admin code
- AND `window.confirm` MUST NOT appear (use shadcn AlertDialog instead)

#### Scenario: NO console.error for user feedback

- GIVEN error handling is implemented in admin components
- WHEN errors are handled
- THEN `console.error` MUST NOT be used to inform users
- AND toast.error() MUST be used instead

---

### Requirement: Sonner Integration

The system MUST have `sonner` Toaster component properly configured in the app layout with `bottom-right` position.

#### Scenario: Toaster position is bottom-right

- GIVEN the app layout renders
- WHEN the Toaster component renders
- THEN position MUST be `bottom-right`
- AND NOT `top-center` or `top-right`

#### Scenario: Toaster is available app-wide

- GIVEN the Toaster is configured in layout.tsx
- WHEN any admin component calls toast.success() or toast.error()
- THEN the toast MUST appear in the browser

---

### Requirement: Loading States

The system MUST display loading states using skeleton components or disabled inputs, NOT spinners blocking the UI.

#### Scenario: Form inputs disabled during submission

- GIVEN a form is being submitted
- WHEN `isPending` is true
- THEN submit button MUST be disabled
- AND button text SHOULD change to "Guardando..."

#### Scenario: Skeleton shown while data loads

- GIVEN a page fetches data on mount
- WHEN data is being fetched
- THEN skeleton placeholders SHOULD be shown
- AND skeletons SHOULD match the layout of actual content

#### Scenario: Table shows skeleton rows during loading

- GIVEN a table page loads data
- WHEN data is being fetched
- THEN 5-10 skeleton rows SHOULD be displayed
- AND each row SHOULD have skeleton cells matching column count

#### Scenario: Button shows loading indicator

- GIVEN a button triggers a mutation
- WHEN the mutation is in flight
- THEN the button SHOULD show a loading state
- AND SHOULD be disabled to prevent double-submit

---

### Requirement: Empty States

The system MUST display meaningful empty states using shadcn `Empty` component when lists have no data.

#### Scenario: Empty rutinas list

- GIVEN the rutinas list page has no rutinas
- WHEN the empty state renders
- THEN shadcn `<Empty>` MUST be used
- AND title MUST be "No hay rutinas creadas"
- AND description SHOULD be "Comienza creando tu primera rutina"
- AND CTA button to "/admin/rutinas/new" SHOULD be present

#### Scenario: Empty search results

- GIVEN a search yields no results
- WHEN the empty state renders
- THEN `<Empty>` MUST be used
- AND title MUST be "No se encontraron resultados"
- AND description SHOULD mention the search term

#### Scenario: Empty días in rutina

- GIVEN a rutina has no días
- WHEN the días section renders
- THEN `<Empty>` MUST be used with appropriate message

#### Scenario: Empty ejercicios in día

- GIVEN a día has no ejercicios
- WHEN the ejercicios section renders
- THEN `<Empty>` MUST be used with appropriate message

---

### Requirement: Error States

The system MUST display errors in a non-blocking manner using toasts or inline messages.

#### Scenario: Non-blocking error toast for mutations

- GIVEN a mutation fails
- WHEN the error is displayed
- THEN a toast.error() MUST appear
- AND the user MUST be able to continue using the page
- AND NO modal or blocking dialog SHOULD appear

#### Scenario: Inline validation errors

- GIVEN form validation fails
- WHEN errors are returned from server action
- THEN error messages MUST appear below affected fields
- AND form content MUST NOT be cleared
- AND user MUST be able to fix and resubmit

#### Scenario: Error indicator for stale/failed data

- GIVEN a data fetch partially fails
- WHEN the page renders
- THEN an error indicator (e.g., AlertCircle icon) MAY appear next to failed data
- AND valid data sections SHOULD still render normally

#### Scenario: Error boundary for unexpected failures

- GIVEN an unexpected error occurs (bug, crash)
- WHEN the error boundary catches it
- THEN error.tsx or global-error.tsx SHOULD render
- AND user SHOULD see a friendly message
- AND error SHOULD be logged server-side

---

### Requirement: Microinteractions

The system SHOULD provide subtle microinteractions to improve user experience and provide feedback.

#### Scenario: Interactive cards have hover effects

- GIVEN an AdminCard with variant="interactive" renders
- WHEN the user hovers over the card
- THEN `hover:shadow-md hover:scale-[1.01]` MUST be applied
- AND `cursor-pointer` MUST be present

#### Scenario: Buttons have transition styles

- GIVEN buttons render in admin pages
- WHEN buttons are defined
- THEN `transition-colors` or `transition-all` SHOULD be present
- AND hover states SHOULD be visible

#### Scenario: Table rows have hover state

- GIVEN an AdminTable renders
- WHEN a row is hovered
- THEN `hover:bg-muted/50` or similar background change MUST occur

#### Scenario: Dropdowns open/close smoothly

- GIVEN a DropdownMenu is triggered
- WHEN the menu opens
- THEN animation SHOULD be smooth
- AND closing SHOULD also be animated

#### Scenario: Focus states are visible

- GIVEN interactive elements (buttons, inputs) render
- WHEN elements receive focus
- THEN visible focus ring MUST be present
- AND focus styles MUST use `focus-visible:ring-2` pattern

---

## FILES AFFECTED

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | MODIFY - Ensure Toaster position is bottom-right |
| `src/components/admin/rutinas-list-client.tsx` | MODIFY - Replace window.confirm with toast.promise() |
| `src/components/admin/rutina-form.tsx` | MODIFY - Add toast.promise() for submissions |
| `src/components/admin/dia-manager.tsx` | MODIFY - Add toast.promise() for mutations |
| `src/components/admin/ejercicio-list.tsx` | MODIFY - Add toast.promise() for mutations |
| `src/components/admin/feriado-manager.tsx` | MODIFY - Verify toast.promise() usage |
| `src/components/admin/delete-rutina-button.tsx` | MODIFY - Replace alert() with toast |
| `src/components/admin/delete-rutina-page-button.tsx` | MODIFY - Replace alert() with toast |

---

## ACCEPTANCE CRITERIA

| ID | Criterion | Verification |
|----|-----------|--------------|
| AF1 | All mutations use toast.promise() pattern | Code review + grep |
| AF2 | No window.alert in admin code | Grep for window.alert |
| AF3 | No window.confirm in admin code | Grep for window.confirm |
| AF4 | Toaster position is bottom-right | Visual inspection |
| AF5 | Forms show loading state during submission | Manual test |
| AF6 | Empty states use shadcn Empty component | Code review |
| AF7 | Error toasts are non-blocking | Manual test |
| AF8 | Validation errors display inline | Manual test |
| AF9 | Interactive cards have hover effects | Visual inspection |
| AF10 | Focus states are visible | Keyboard navigation test |
