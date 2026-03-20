# Delta for Admin Panel — Toast Notifications

## MODIFIED Requirements

### Requirement: Gym Price Configuration

**Previous text:**
> Admins MUST be able to view and edit the gym subscription price. The server action returns ad-hoc `{ success, message, data }` structure.

**New text:**
> Admins MUST be able to view and edit the gym subscription price. The server action MUST return `FormState<T>` and the component MUST use `useActionState` (React 19). On successful save, a toast notification MUST be displayed.

#### Scenario: Display current price

- GIVEN The admin page loads
- WHEN The component fetches from GET /api/gym
- THEN The current price MUST be displayed in a readable format (e.g., "$45.000")

#### Scenario: Loading state

- GIVEN The admin page is loading
- WHEN The API request is in flight
- THEN A loading skeleton or spinner MUST be displayed

#### Scenario: Enter edit mode

- GIVEN The admin user is viewing the price display
- WHEN The user clicks the "Editar precio" button
- THEN The display MUST change to a numeric input field
- AND The current price MUST be pre-filled in the input

#### Scenario: Cancel edit

- GIVEN The user is in edit mode with unsaved changes
- WHEN The user clicks a cancel button
- THEN The input MUST be discarded
- AND The original price MUST be displayed again

#### Scenario: Save new price with success toast

- GIVEN The user is in edit mode with a valid new price
- WHEN The user clicks "Guardar"
- THEN The server action MUST be called with `useActionState`
- AND On success, the display MUST update with the new price
- AND The component MUST exit edit mode
- AND A toast success notification MUST be displayed: "Precio actualizado exitosamente"

#### Scenario: Save with validation error

- GIVEN The user is in edit mode with invalid input (less than 1000, more than 500000, or more than 2 decimal places)
- WHEN The user clicks "Guardar"
- THEN A validation error message MUST be displayed below the input
- AND The request MUST NOT complete

#### Scenario: Save with server error

- GIVEN The user is in edit mode with valid input
- WHEN The server action returns an error
- THEN A toast error notification MUST be displayed with the error message
- AND The component MUST remain in edit mode

#### Scenario: Price formatting

- GIVEN The price value is 45000
- WHEN The price is rendered for display
- THEN It MUST be displayed as "$45.000" (peso sign, thousand separator)

#### Scenario: Input sync with server state

- GIVEN The user is in edit mode
- WHEN The server action returns a new price (e.g., after another user edited)
- THEN The input MUST resync using `key={serverPrice}` to force re-mount

---

## ADDED Requirements

### Requirement: Toast Notifications for Mutations

All mutation components in the admin panel MUST display toast notifications using Sonner. The system MUST provide immediate visual feedback for every create, update, and delete operation.

The system MUST display a toast.success() for operations that complete successfully.

The system MUST display a toast.error() for operations that fail.

#### Scenario: Routine created shows toast

- GIVEN An admin creates a new routine via rutina-form.tsx
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Rutina '{nombre}' creada exitosamente"

#### Scenario: Routine updated shows toast

- GIVEN An admin updates a routine via rutina-form.tsx
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Rutina '{nombre}' actualizada"

#### Scenario: Routine deleted shows toast

- GIVEN An admin deletes a routine via delete-rutina-button.tsx
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Rutina eliminada"

#### Scenario: Routine duplicated shows toast

- GIVEN An admin duplicates a routine via rutinas-list-client.tsx
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Rutina duplicada exitosamente"

#### Scenario: Routine duplicated shows error toast on failure

- GIVEN An admin duplicates a routine via rutinas-list-client.tsx
- WHEN The server action returns an error
- THEN A toast error MUST be displayed with the error message

#### Scenario: Day created shows toast

- GIVEN An admin adds a day via dia-manager.tsx
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Día agregado a la rutina"

#### Scenario: Day updated shows toast

- GIVEN An admin updates a day via dia-manager.tsx
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Día actualizado"

#### Scenario: Day deleted shows toast

- GIVEN An admin deletes a day via dia-manager.tsx
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Día eliminado"

#### Scenario: Ejercicio created shows toast

- GIVEN An admin creates an ejercicio via ejercicio-form.tsx
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Ejercicio agregado"

#### Scenario: Ejercicio updated shows toast

- GIVEN An admin updates an ejercicio via ejercicio-form.tsx
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Ejercicio actualizado"

#### Scenario: Ejercicio deleted shows toast

- GIVEN An admin deletes an ejercicio via ejercicio-list.tsx
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Ejercicio eliminado"

#### Scenario: Feriado created shows toast

- GIVEN An admin creates a Feriado via FeriadoManager.tsx
- WHEN The server action returns success
- THEN A toast.success MUST be displayed

#### Scenario: Feriado deleted shows toast

- GIVEN An admin deletes a Feriado via FeriadoManager.tsx
- WHEN The server action returns success
- THEN A toast.success MUST be displayed

#### Scenario: Reorder exercises shows toast

- GIVEN An admin reorders exercises via drag-and-drop
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Orden de ejercicios actualizado"

#### Scenario: Reorder days shows toast

- GIVEN An admin reorders days in a routine
- WHEN The server action returns success
- THEN A toast MUST be displayed: "Orden de días actualizado"

---

### Requirement: Elimination of alert()

The system MUST NOT use `window.alert()` or `alert()` in any client-side code for user feedback. All alert() calls MUST be replaced with toast notifications.

#### Scenario: alert() replaced with toast in rutinas-list-client

- GIVEN An admin creates a routine
- WHEN the createRutina server action completes successfully
- THEN toast.success() MUST be called instead of alert()
- AND NO window.alert() or alert() MUST appear in the code

#### Scenario: alert() replaced with toast on delete

- GIVEN An admin deletes a routine
- WHEN the deleteRutina server action completes
- THEN toast.success() MUST be called instead of alert()

---

## Technical Notes

### Toast Implementation Pattern

Components MUST use `useEffect` with `useActionState` to detect state changes:

```typescript
useEffect(() => {
  if (!isPending && state.success) {
    toast.success(state.message || "Operación exitosa");
  } else if (!isPending && !state.success && state.message) {
    toast.error(state.message);
  }
}, [isPending, state.success, state.message]);
```

### Server Action Message Contract

All 16 server actions MUST return `message` in their `FormState<T>` response:

| Action | Success Message |
|--------|-----------------|
| createRutina | "Rutina '{nombre}' creada exitosamente" |
| updateRutina | "Rutina '{nombre}' actualizada" |
| duplicateRutina | "Rutina duplicada exitosamente" |
| deleteRutina | "Rutina eliminada" |
| createRutinaCompleta | "Rutina '{nombre}' creada con {n} días" |
| createDia | "Día agregado a la rutina" |
| updateDia | "Día actualizado" |
| deleteDia | "Día eliminado" |
| reorderDias | "Orden de días actualizado" |
| createEjercicio | "Ejercicio agregado" |
| updateEjercicio | "Ejercicio actualizado" |
| deleteEjercicio | "Ejercicio eliminado" |
| reorderEjercicios | "Orden de ejercicios actualizado" |
| createFeriado | "Feriado creado" |
| deleteFeriado | "Feriado eliminado" |
| updateGymPrice | "Precio actualizado exitosamente" |
