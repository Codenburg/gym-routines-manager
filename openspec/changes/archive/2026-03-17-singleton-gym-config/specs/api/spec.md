# Delta for API

## Purpose

This spec defines the backend API endpoints required to expose the singleton Gym configuration for read and update operations.

## ADDED Requirements

### Requirement: GET /api/gym Endpoint

The system MUST provide a read-only endpoint to retrieve the current gym configuration.

#### Scenario: Fetch gym configuration successfully

- GIVEN A Gym record exists with id "gym" in the database
- WHEN A GET request is made to /api/gym
- THEN The response MUST return HTTP status 200
- AND The response body MUST contain the Gym object with id, price, createdAt, updatedAt

#### Scenario: Fetch gym when database is empty

- GIVEN No Gym record exists in the database
- WHEN A GET request is made to /api/gym
- THEN The response MUST return HTTP status 200
- AND The response MUST return a default Gym object with id "gym" and price 0 (auto-create)

### Requirement: PATCH /api/gym Endpoint

The system MUST provide an authenticated endpoint to update gym configuration.

#### Scenario: Update gym price successfully

- GIVEN A user is authenticated as admin
- AND A Gym record exists with id "gym" and price 45000
- WHEN A PATCH request is made to /api/gym with body `{ "price": 50000 }`
- THEN The response MUST return HTTP status 200
- AND The response body MUST contain the updated Gym object
- AND The database MUST have the new price persisted

#### Scenario: Update gym price with invalid input

- GIVEN A user is authenticated as admin
- AND A Gym record exists with id "gym"
- WHEN A PATCH request is made to /api/gym with body `{ "price": -100 }`
- THEN The response MUST return HTTP status 400
- AND The response body MUST contain validation error details

#### Scenario: Update gym without authentication

- GIVEN No authenticated session exists
- WHEN A PATCH request is made to /api/gym
- THEN The response MUST return HTTP status 401
- AND The response body MUST contain an error message

#### Scenario: Update gym without admin privileges

- GIVEN A user is authenticated but is NOT an admin
- WHEN A PATCH request is made to /api/gym
- THEN The response MUST return HTTP status 403
- AND The response body MUST contain an error message indicating insufficient permissions

### Requirement: Input Validation

The system MUST validate all input data to prevent invalid or malicious data from being persisted.

#### Scenario: Validate price is positive

- GIVEN A PATCH request with price set to 0
- WHEN The validation logic processes the request
- THEN The request MUST be rejected with a validation error

#### Scenario: Validate price is a number

- GIVEN A PATCH request with price set to "abc"
- WHEN The validation logic processes the request
- THEN The request MUST be rejected with a validation error

### Requirement: Response Format

The API MUST return consistent response formats for success and error scenarios.

#### Scenario: Successful response format

- GIVEN A successful GET or PATCH request
- WHEN The API responds
- THEN The response MUST include appropriate HTTP status code
- AND The response body MUST be valid JSON

#### Scenario: Error response format

- GIVEN An error occurs during request processing
- WHEN The API responds with an error
- THEN The response MUST include appropriate HTTP status code (4xx or 5xx)
- AND The response body MUST contain an "error" field with a descriptive message

## API Specification

### GET /api/gym

**Description**: Returns the singleton gym configuration

**Authentication**: None required

**Response 200**:
```json
{
  "id": "gym",
  "price": 45000,
  "createdAt": "2026-03-17T10:00:00.000Z",
  "updatedAt": "2026-03-17T10:00:00.000Z"
}
```

**Response 500**:
```json
{
  "error": "Service temporarily unavailable. Please try again later."
}
```

### PATCH /api/gym

**Description**: Updates the gym configuration (price only for this version)

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "price": 50000
}
```

**Response 200**:
```json
{
  "id": "gym",
  "price": 50000,
  "createdAt": "2026-03-17T10:00:00.000Z",
  "updatedAt": "2026-03-17T12:00:00.000Z"
}
```

**Response 400** (Validation Error):
```json
{
  "error": "Validation failed",
  "details": {
    "price": ["Price must be a positive number"]
  }
}
```

**Response 401** (Unauthorized):
```json
{
  "error": "Debes iniciar sesión"
}
```

**Response 403** (Forbidden):
```json
{
  "error": "No tienes permisos de administrador"
}
```

## Acceptance Criteria

- [ ] GET /api/gym returns 200 with gym object
- [ ] GET /api/gym auto-creates gym if not exists
- [ ] PATCH /api/gym updates price successfully for admin users
- [ ] PATCH /api/gym returns 401 for unauthenticated requests
- [ ] PATCH /api/gym returns 403 for non-admin authenticated users
- [ ] PATCH /api/gym validates price is positive number
- [ ] All responses follow consistent JSON format
