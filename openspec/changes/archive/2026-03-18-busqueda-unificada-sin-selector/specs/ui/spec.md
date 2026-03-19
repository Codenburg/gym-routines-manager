# Delta for Search UI

## MODIFIED Requirements

### Requirement: SearchBar sin selector de tipo

El componente `SearchBar` DEBE tener una única caja de búsqueda sin dropdown "Buscar por".

(Previously: Tenía un Select dropdown para elegir entre "Nombre" y "Entrenador")

#### Scenario: SearchBar sin dropdown

- GIVEN el usuario está en la homepage
- WHEN el usuario ve el SearchBar
- THEN ve UNA sola caja de búsqueda
- AND NO ve el dropdown "Buscar por"

### Requirement: Autocomplete en búsqueda

El SearchBar DEBE mostrar un autocomplete con secciones "Rutinas" y "Entrenadores" mientras el usuario escribe.

#### Scenario: Autocomplete muestra dos secciones

- GIVEN el usuario escribe "Juan" en el SearchBar
- AND existen rutinas y creadores con "Juan"
- WHEN el usuario hace pause (300ms)
- THEN aparece un dropdown con:
  - Sección "Rutinas" con匹配的 rutinas (máximo 5)
  - Sección "Entrenadores" con creadores únicos encontrados (máximo 5)

#### Scenario: Autocomplete muestra solo rutinas

- GIVEN el usuario escribe "Pierna"
- AND existen solo rutinas con "Pierna"
- AND no existen creadores con "Pierna"
- WHEN aparecen resultados
- THEN muestra solo la sección "Rutinas"
- AND la sección "Entrenadores" no aparece o aparece vacía

#### Scenario: Sin resultados en autocomplete

- GIVEN el usuario escribe "xyz123"
- AND no existen rutinas ni creadores con ese término
- WHEN aparecen resultados
- THEN muestra mensaje: "No se encontraron resultados para 'xyz123'"
- AND sugiere: "Prueba con términos más cortos o diferentes"

### Requirement: Selección de rutina del autocomplete

- GIVEN el usuario ve el autocomplete abierto con resultados
- WHEN hace click en una rutina de la lista
- THEN navega a la página de detalle de esa rutina
- AND el autocomplete se cierra

### Requirement: Selección de entrenador del autocomplete

- GIVEN el usuario ve el autocomplete abierto con resultados
- WHEN hace click en un entrenador de la lista
- THEN:
  - Se cierra el autocomplete
  - Se aplica un filtro activo "Entrenador: [nombre]"
  - Se muestran solo las rutinas de ese entrenador
  - La URL cambia a `/?creador=[nombre]`

## ADDED Requirements

### Requirement: Filtros activos como chips

El sistema DEBE mostrar filtros activos como chips/badges cerca del SearchBar cuando hay un filtro aplicado.

#### Scenario: Filtro de entrenador activo

- GIVEN el usuario seleccionó un entrenador del autocomplete
- WHEN la página muestra los resultados filtrados
- THEN muestra un chip con:
  - Texto: "Entrenador: Juan Pérez"
  - Icono de "X" para remover
- AND al hacer click en la "X", se remueve el filtro
- AND la URL vuelve a `/?search=[término]`

#### Scenario: Múltiples filtros activos

- GIVEN el usuario tiene un filtro de entrenador activo
- AND el usuario busca otro término
- WHEN se muestran resultados
- THEN puede ver múltiples chips de filtro
- AND cada chip tiene su propia "X" para remover

#### Scenario: Remover filtro de chip

- GIVEN hay un chip de filtro activo "Entrenador: Juan Pérez"
- WHEN el usuario hace click en la "X" del chip
- THEN:
  - El chip desaparece
  - Se muestran todas las rutinas (sin filtro de creador)
  - La URL cambia a `/?search=[término actual]`

### Requirement: Debounce para autocomplete

El sistema DEBE esperar 300ms después del último carácter antes de ejecutar la búsqueda del autocomplete.

(Previously: Este requisito ya existe para la búsqueda con Enter)

#### Scenario: Debounce evita búsquedas excesivas

- GIVEN el usuario escribe "P"
- WHEN inmediatamente después escribe "e", "r", "r", "o"
- THEN la búsqueda al autocomplete se ejecuta UNA SOLA VEZ con "perro"
- AND no se ejecutan búsquedas intermedias

### Requirement: Limpiar búsqueda

- GIVEN el usuario tiene una búsqueda activa y filtros
- WHEN el usuario borra todo el texto del SearchBar
- AND espera 300ms
- THEN:
  - Se limpian los filtros activos
  - Se muestran todas las rutinas
  - La URL cambia a `/`

## REMOVED Requirements

### Requirement: Selector "Buscar por" (ELIMINADO)

(Reason: Ahora la búsqueda es unificada, no necesita selector de tipo)

### Requirement: Búsqueda por nombre únicamente (REEMPLAZADO)

(Reason: Reemplazado por búsqueda combinada)
