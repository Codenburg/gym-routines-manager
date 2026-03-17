# Delta for Search API

## MODIFIED Requirements

### Requirement: Búsqueda unificada en rutinas

El endpoint `/api/rutinas` DEBE soportar búsqueda combinada en `nombre` y `creador` de la rutina, retornando resultados ordenados por relevancia.

#### Scenario: Búsqueda combinada sin selector de tipo

- GIVEN el usuario envía `GET /api/rutinas?search=Full`
- WHEN la búsqueda es "Full"
- THEN retorna rutinas donde `nombre` ILIKE '%Full%' O `creador` ILIKE '%Full%'
- AND los resultados incluyen tanto rutinas como creadores en el campo `creador`

#### Scenario: Ranking de resultados por relevancia

- GIVEN el usuario envía `GET /api/rutinas?search=Juan`
- AND existen rutinas:
  - Routine A: nombre="Rutina de Juan" (match exacto parcial en nombre)
  - Routine B: nombre="Full Body" creador="Juan Pérez" (match exacto parcial en creador)
  - Routine C: nombre="Rutina Juan" (match exacto en nombre)
  - Routine D: nombre="Entrenamiento" creador="Juan" (match parcial en creador)
- THEN los resultados se ordenan:
  1. Routine C (match exacto en nombre) - prioridad 1
  2. Routine A (match parcial en nombre) - prioridad 2
  3. Routine B (match exacto en creador) - prioridad 3
  4. Routine D (match parcial en creador) - prioridad 4

#### Scenario: Paginación de resultados

- GIVEN el usuario envía `GET /api/rutinas?search=Full&page=1&limit=10`
- THEN retorna máximo 10 resultados
- AND incluye metadatos de paginación (`total`, `page`, `limit`, `totalPages`)

## ADDED Requirements

### Requirement: Endpoint de búsqueda unificada

El sistema DEBE proporcionar un endpoint `/api/search/unified` que retorne resultados separados por tipo (rutinas y entrenadores) para mostrar en el autocomplete.

#### Scenario: Búsqueda unificada retorna ambas secciones

- GIVEN el usuario envía `GET /api/search/unified?q=Juan`
- AND existen rutinas con "Juan" en el nombre y creadores con "Juan" en el nombre
- THEN retorna:
  - `rutinas`: array de rutinas con match (máximo 5)
  - `entrenadores`: array de creadores únicos con match (máximo 5)

#### Scenario: Búsqueda solo retorna rutinas

- GIVEN el usuario envía `GET /api/search/unified?q=Pierna`
- AND existen solo rutinas con "Pierna" en el nombre
- AND no existen creadores con "Pierna"
- THEN retorna:
  - `rutinas`: array con las rutinas encontradas
  - `entrenadores`: array vacío

#### Scenario: Búsqueda sin resultados

- GIVEN el usuario envía `GET /api/search/unified?q=xyz123`
- AND no existen rutinas ni creadores con ese término
- THEN retorna:
  - `rutinas`: []
  - `entrenadores`: []
  - `message`: "No se encontraron resultados para 'xyz123'. Prueba con términos más cortos o diferentes."

### Requirement: Filtrado por entrenador específico

El sistema DEBE permitir filtrar rutinas por un creador específico mediante parámetro `creador`.

#### Scenario: Filtrar rutinas por creador

- GIVEN el usuario envía `GET /api/rutinas?creador=Juan%20Pérez`
- THEN retorna solo rutinas donde `creador = 'Juan Pérez'`

#### Scenario: Búsqueda combinada con filtro de creador

- GIVEN el usuario envía `GET /api/rutinas?search=Full&creador=Juan%20Pérez`
- THEN retorna rutinas donde:
  - (`nombre` ILIKE '%Full%' O `creador` ILIKE '%Full%')
  - AND `creador = 'Juan Pérez'`
