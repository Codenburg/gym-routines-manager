# E2E Test Suite

This directory holds the Playwright E2E test suite for the
`gymflow` app, plus shared test infrastructure (helpers +
page objects).

## Quick start

The fastest way to run the test suite (excluding the slow security-admin
suite) is the `test:fast` script:

```bash
pnpm test:fast
```

This command:

1. Starts the Next.js dev server in the background
2. Waits for `http://localhost:3000` to be reachable (`wait-on`)
3. Runs `playwright test --grep-invert @slow` in parallel

The first run is slow (~5-8 min) because Next.js compiles routes on
demand. Subsequent runs within the same dev-server lifetime are fast
(~1-2 min) because the dev server is already warm.

## Manual 2-terminal workflow

If `test:fast` doesn't work in your shell (e.g. you need to inspect dev
server output), use the manual 2-terminal pattern:

**Terminal 1** — start the dev server:

```bash
pnpm dev
```

**Terminal 2** — run the tests:

```bash
pnpm test                        # full suite
pnpm test --grep-invert @slow    # fast (exclude security-admin)
pnpm test tests/gym-config.spec.ts   # single spec
pnpm test --grep "5.1"               # by test name pattern
```

## Test structure

```
tests/
├── helpers.ts                  # loginAsAdmin, cleanTestData, waitForToast
├── pages/                      # Page Object Model
│   ├── base-page.ts            # Abstract BasePage (hydration guard, toasts)
│   ├── AuthPage.ts             # /admin/login
│   ├── RoutineAdminPage.ts     # /admin/rutinas, /admin/rutinas/new
│   ├── FeriadoAdminPage.ts     # /admin/feriados
│   ├── PromocionAdminPage.ts   # /admin/promociones
│   ├── DescuentoAdminPage.ts   # /admin/descuentos-duracion
│   └── TrainerAdminPage.ts     # /admin/trainers
├── utils/security-helpers.ts   # Legacy security helpers (apiRequest, etc.)
└── *.spec.ts                   # 19 spec files (existing) + 5 new (Slices 1-3)
```

The page object layer is **flat** under `tests/pages/` — it does NOT
co-locate with the spec files. This matches the existing 19 flat spec
files and avoids fragmenting the convention.

## Selector priority

All page object methods follow this priority order (Playwright skill +
`openspec/config.yaml:285-287` data-testid policy):

1. **`getByRole`** — for interactive elements with visible text
   (buttons, links, headings).
2. **`getByLabel`** — for form inputs with associated `<label>`.
3. **`getByText`** — for static content (rarely needed).
4. **`getByTestId`** — last resort, for elements with no stable
   accessible name (date inputs, dynamic list rows, toast containers).

When a method could use either `getByLabel` OR `getByTestId`, prefer
`getByLabel` for resilience to refactors:

```typescript
async fillNombre(value: string): Promise<void> {
  const byLabel = this.page.getByLabel('Nombre');
  if (await byLabel.count() > 0) {
    await byLabel.fill(value);
    return;
  }
  // Fallback: data-testid added by this change
  await this.page.getByTestId('rutina-nombre-input').fill(value);
}
```

## Test isolation

State-mutating specs (Slices 1-3) follow this isolation contract:

1. **Serial mode** — `test.describe.configure({ mode: 'serial' })` at
   the top of every state-mutating spec. Prevents concurrent
   `cleanTestData` calls from racing on the same record.
2. **TEST_ prefix** — every record created by a test uses a
   discriminator prefix (`TEST_Rutina_<RUN_ID>`, `TEST_Feriado_<date>`,
   `TEST_Trainer_<DNI>`, etc.). The cleanup helper iterates
   `/api/{promociones,feriados,rutinas,descuentos-duracion,trainers}`
   and deletes records where the discriminator starts with `TEST_`.
3. **afterEach cleanup** — `test.afterEach(async ({ page }) => {
   await cleanTestData(page); })` deletes the test data after each
   test, so re-runs and parallel suites don't collide.
4. **Fresh session per test** — `test.use({ storageState: undefined })`
   forces a fresh login per test. The cost is ~2-3s per test (login is
   fast); the benefit is hermetic tests.

## Authentication

The single `loginAsAdmin(page)` helper in `tests/helpers.ts` handles
all admin login flows. It:

- Uses the seeded credentials (`DNI: 11111111`, `password: nando123`)
- Fills the form via `getByLabel('DNI')` and `getByLabel('Contraseña')`
- Waits for the `/admin` redirect
- **Hydration guard**: waits for the `Panel de Administraci` heading
  (15s timeout) before returning. This is the GGA-FOLLOWUP-4
  mitigation — without it, subsequent admin navigations can race
  the sidebar hydration and flake.

DO NOT add inline `loginAsAdmin` functions to new specs. Always import
from `./helpers`.

## Slow suite

The `security-admin.spec.ts` suite (~40 tests) is tagged `@slow` and
excluded from `test:fast`. It tests:

- Auth bypass (unauthenticated access)
- Input validation (SQL injection, XSS)
- Authorization (verifyAdmin bypass, cross-user access)
- Session management (expiration, concurrent sessions, logout, fixation)

These tests are slow because they exercise cookie-based auth edge
cases. To run them explicitly:

```bash
pnpm test tests/security-admin.spec.ts
# or
pnpm test --grep "@slow"
```

## When adding a new admin flow spec

1. Use the matching page object from `tests/pages/<Name>AdminPage.ts`.
2. If the page object doesn't exist, create it (extend `BasePage`).
3. Tag the data-testid attributes you reference in the corresponding
   admin component (additive only — never rename existing testids).
4. Configure `serial` mode and `afterEach(cleanTestData)` for state-
   mutating suites.
5. Import `loginAsAdmin` from `./helpers` — never define inline.

## References

- `openspec/changes/e2e-coverage-critical-flows/design.md` — design
  rationale for the helpers + page objects layer
- `openspec/changes/e2e-coverage-critical-flows/tasks.md` — work
  breakdown (12 tasks across 4 stacked-to-main PRs)
- `~/skills/playwright` — page object model, selector priority, file
  structure (in this repo's skill registry)
- `~/skills/work-unit-commits` — commit-by-work-unit rule
