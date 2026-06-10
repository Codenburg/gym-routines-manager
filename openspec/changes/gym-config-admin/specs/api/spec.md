# Delta for API

## MODIFIED Requirements

### Requirement: GET /api/gym Endpoint

The system MUST provide a read-only endpoint to retrieve the current gym configuration. The response MUST include the six new display fields (`nombre`, `horario`, `direccion`, `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp`) in addition to the existing `price`, `createdAt`, `updatedAt`.
(Previously: Response included only `id`, `price`, `createdAt`, `updatedAt`.)

#### Scenario: Fetch gym configuration successfully

- GIVEN A Gym record exists with id "gym"
- WHEN A GET request is made to /api/gym
- THEN The response MUST return HTTP status 200
- AND The body MUST include id, price, createdAt, updatedAt
- AND The body MUST also include nombre, horario, direccion, mapsEmbedUrl, socialInstagram, socialWhatsapp (any MAY be null)

#### Scenario: Fetch gym when database is empty

- GIVEN No Gym record exists
- WHEN A GET request is made to /api/gym
- THEN The response MUST return HTTP 200
- AND a default Gym object with id "gym" and price 0 MUST be returned (auto-create)
- AND all new display fields MUST default to null

#### Scenario: Fetch gym with partial fields

- GIVEN Only `nombre` and `horario` are set; other display fields are null
- WHEN A GET request is made to /api/gym
- THEN The response MUST include nombre and horario with their values
- AND null fields MUST be JSON `null` (not omitted, not empty string)

### Requirement: PATCH /api/gym Endpoint

The system MUST provide an authenticated endpoint to update gym configuration. The endpoint MUST accept any subset of the six new display fields plus `price`, validate via Zod, and reject invalid input with HTTP 400 and field-level error details.
(Previously: Only `price` was accepted in the PATCH body.)

#### Scenario: Update display fields successfully

- GIVEN An authenticated admin
- AND A Gym record with `nombre = "Old"`
- WHEN A PATCH is made with `{ "nombre": "New", "horario": "Lun-Vie 7-22" }`
- THEN The response MUST return HTTP 200
- AND the response body MUST contain the updated Gym object
- AND the DB MUST persist the new nombre and horario

#### Scenario: Update price with invalid input

- GIVEN An authenticated admin
- WHEN A PATCH is made with `{ "price": -100 }`
- THEN The response MUST return HTTP 400
- AND the body MUST contain validation error details

#### Scenario: Invalid URL for socialInstagram

- GIVEN An authenticated admin
- WHEN A PATCH is made with `{ "socialInstagram": "not-a-url" }`
- THEN The response MUST return HTTP 400 with a validation error for `socialInstagram`

#### Scenario: Invalid URL for mapsEmbedUrl

- GIVEN An authenticated admin
- WHEN A PATCH is made with `{ "mapsEmbedUrl": "not-a-url" }`
- THEN The response MUST return HTTP 400 with a validation error for `mapsEmbedUrl`

#### Scenario: Update without authentication

- GIVEN No authenticated session
- WHEN A PATCH is made to /api/gym
- THEN The response MUST return HTTP 401 with an error message

#### Scenario: Update without admin privileges

- GIVEN An authenticated non-admin user
- WHEN A PATCH is made to /api/gym
- THEN The response MUST return HTTP 403 with an error message

### Requirement: Input Validation

The system MUST validate all PATCH input via Zod: positive `price` (existing), non-empty `nombre` when present, valid URL format for `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp` when present, and free-text for `horario` and `direccion`.
(Previously: Validation only covered `price`.)

#### Scenario: Validate price is positive

- GIVEN A PATCH request with `price = 0`
- WHEN The validation logic processes the request
- THEN The request MUST be rejected with a validation error

#### Scenario: Validate price is a number

- GIVEN A PATCH request with `price = "abc"`
- WHEN The validation logic processes the request
- THEN The request MUST be rejected

#### Scenario: Validate nombre is non-empty when present

- GIVEN A PATCH request with `nombre = ""`
- WHEN The validation logic processes the request
- THEN The request MUST be rejected

#### Scenario: Validate URL format for URL fields

- GIVEN A PATCH request with any of `mapsEmbedUrl`, `socialInstagram`, `socialWhatsapp` set to a non-URL string
- WHEN The validation logic processes the request
- THEN The request MUST be rejected with a validation error for the offending field

#### Scenario: Allow partial updates

- GIVEN A PATCH request with only `{ "nombre": "New Name" }`
- WHEN The validation logic processes the request
- THEN The request MUST be accepted and ONLY the `nombre` field MUST be updated in the DB

---

## API Specification (Updated)

### GET /api/gym (Extended Response)

**Authentication**: None required

**Response 200**:
```json
{
  "id": "gym",
  "price": 45000,
  "nombre": "Titanium Gym",
  "horario": "Lun-Vie 7:00-22:00",
  "direccion": "Av. Siempre Viva 742",
  "mapsEmbedUrl": "https://www.google.com/maps/embed?...",
  "socialInstagram": "https://instagram.com/titanium",
  "socialWhatsapp": "https://wa.me/5491112345678",
  "createdAt": "2026-03-17T10:00:00.000Z",
  "updatedAt": "2026-03-17T10:00:00.000Z"
}
```

Any display field MAY be `null`.

### PATCH /api/gym (Extended Body)

**Authentication**: Required (Admin only)

**Request Body** (all fields optional, at least one required):
```json
{
  "price": 50000,
  "nombre": "Titanium Gym",
  "horario": "Lun-Vie 7:00-22:00",
  "direccion": "Av. Siempre Viva 742",
  "mapsEmbedUrl": "https://www.google.com/maps/embed?...",
  "socialInstagram": "https://instagram.com/titanium",
  "socialWhatsapp": "https://wa.me/5491112345678"
}
```

**Response 200**: Same shape as GET 200.

**Response 400**:
```json
{
  "error": "Validation failed",
  "details": {
    "nombre": ["Name cannot be empty"],
    "socialInstagram": ["Invalid URL"]
  }
}
```
