# Delta for UI - Search Component

## MODIFIED Requirements

### Requirement: SearchBar debe soportar búsqueda reactiva

El componente `SearchBar` DEBE permitir al usuario ejecutar una búsqueda sin necesidad de presionar la tecla Enter. La búsqueda DEBE ejecutarse automáticamente cuando el usuario deja de escribir.

**Versión anterior**: El usuario debía escribir en el input y presionar Enter para ejecutar la búsqueda.

#### Scenario: Búsqueda automática al escribir

- GIVEN el usuario está en la homepage con el SearchBar visible
- WHEN el usuario escribe "Full" en el campo de búsqueda
- AND no presiona ninguna tecla adicional durante 300ms
- THEN la URL cambia a `/?search=Full`
- AND los resultados de rutinas se filtran automáticamente

#### Scenario: Búsqueda con múltiples palabras

- GIVEN el usuario está en la homepage
- WHEN el usuario escribe "Rutina de Piernas" rápidamente
- AND espera 300ms después del último carácter
- THEN la URL cambia a `/?search=Rutina%20de%20Piernas`
- AND los resultados muestran solo rutinas que contienen "Rutina de Piernas"

#### Scenario: Limpiar búsqueda automáticamente

- GIVEN el usuario tiene una búsqueda activa con "Full" en la URL
- WHEN el usuario borra todo el texto del SearchBar
- AND espera 300ms
- THEN la URL cambia a `/` (sin parámetro search)
- AND se muestran todas las rutinas

### Requirement: Debounce para evitar llamadas excesivas

El sistema DEBE implementar un debounce de al menos 300ms para evitar ejecutar búsquedas en cada keystroke.

#### Scenario: Múltiples teclas rápido no disparan múltiples búsquedas

- GIVEN el usuario escribe "P"
- WHEN inmediatamente después escribe "e", "r", "n", "a"
- THEN la búsqueda se ejecuta UNA SOLA VEZ con "pierna"
- AND no se ejecutan búsquedas intermedias con "p", "pe", "per"

## ADDED Requirements

### Requirement: El SearchBar debe ser un input controlado

El componente DEBE mantener el valor del input sincronizado con el estado interno para permitir el comportamiento reactivo.

- GIVEN el usuario tiene una búsqueda activa
- WHEN navega a otra página y vuelve
- THEN el valor del input muestra el término de búsqueda actual
